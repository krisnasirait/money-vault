import { db } from "./firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    runTransaction,
    deleteDoc,
    Timestamp,
    writeBatch
} from "firebase/firestore";
import { Transaction } from "@/types";

const COLLECTION = "transactions";
const ACCOUNTS_COLLECTION = "accounts";

export async function getRecentTransactions(userId: string, limitCount = 5): Promise<Transaction[]> {
    const q = query(
        collection(db, COLLECTION),
        where("ownerId", "==", userId),
        orderBy("date", "desc"),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Transaction));
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
    const q = query(
        collection(db, COLLECTION),
        where("ownerId", "==", userId),
        orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Transaction));
}

export async function addTransaction(userId: string, data: Omit<Transaction, "id" | "ownerId" | "createdAt">) {
    // Use a Firestore Transaction to ensure account balance is updated atomically
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Create reference for new transaction
            const newTxRef = doc(collection(db, COLLECTION));

            // 2. Get account reference (Source Account)
            const accountRef = doc(db, ACCOUNTS_COLLECTION, data.accountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw "Account does not exist!";
            }

            const currentBalance = accountDoc.data().balance;
            const amount = Number(data.amount);
            const fee = data.transferFee ? Number(data.transferFee) : 0;

            // 3. Handle Transfer Logic
            if (data.type === 'transfer') {
                if (!data.toAccountId) throw "Destination account required for transfer";

                // Get Destination Account
                const destAccountRef = doc(db, ACCOUNTS_COLLECTION, data.toAccountId);
                const destAccountDoc = await transaction.get(destAccountRef);
                if (!destAccountDoc.exists()) throw "Destination Account does not exist";

                const destBalance = destAccountDoc.data().balance;

                // Calculate New Balances
                // Source: Subtract Amount + Fee
                const newSourceBalance = currentBalance - amount - fee;
                // Dest: Add Amount
                const newDestBalance = destBalance + amount;

                // Write Transaction
                // Clean data to remove undefined values if any, specifically transferFee
                const cleanData = { ...data };
                if (cleanData.transferFee === undefined) cleanData.transferFee = 0;

                transaction.set(newTxRef, {
                    ...cleanData,
                    transferFee: fee, // Explicitly use the calculated fee (which defaults to 0)
                    ownerId: userId,
                    date: Timestamp.fromDate(new Date(data.date)),
                    createdAt: serverTimestamp(),
                });

                // Update Accounts
                transaction.update(accountRef, { balance: newSourceBalance });
                transaction.update(destAccountRef, { balance: newDestBalance });

                return;
            }

            // 3b. Standard Income/Expense
            // Income adds to balance, Expense subtracts
            let newBalance = currentBalance;
            if (data.type === 'income') {
                newBalance += amount;
            } else {
                newBalance -= amount;
            }

            // 4. Write Transaction
            // Sanitize
            const cleanData = { ...data };
            delete cleanData.transferFee; // Not needed for non-transfers, or set to undefined which fires error? 
            // Better to just not include it if it's undefined. 
            // Actually, if we use ...cleanData and it has undefined, it crashes.
            // Let's manually reconstruct the object or use a utility.
            // For now, simple fix for the reported error:
            const payload: any = {
                ...data,
                ownerId: userId,
                date: Timestamp.fromDate(new Date(data.date)),
                createdAt: serverTimestamp(),
            };
            // Remove undefined fields
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            transaction.set(newTxRef, payload);

            // 5. Update Account
            transaction.update(accountRef, { balance: newBalance });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}

export async function updateTransaction(
    userId: string,
    transactionId: string,
    oldData: Transaction,
    newData: Partial<Transaction>
) {
    try {
        await runTransaction(db, async (transaction) => {
            const txRef = doc(db, COLLECTION, transactionId);

            // Merge old and new data to get the full final state
            const finalData = { ...oldData, ...newData };

            // Check if ANY field affecting balance has changed
            const amountChanged = newData.amount !== undefined && newData.amount !== oldData.amount;
            const typeChanged = newData.type !== undefined && newData.type !== oldData.type;
            const accountChanged = newData.accountId !== undefined && newData.accountId !== oldData.accountId;
            const toAccountChanged = newData.toAccountId !== undefined && newData.toAccountId !== oldData.toAccountId;
            const feeChanged = newData.transferFee !== undefined && newData.transferFee !== oldData.transferFee;

            // If just updating metadata (notes, category, date?? Date affects sorting but not balance, unless we track daily balances)
            // For now assuming date change doesn't trigger balance re-calc (it shouldn't).
            if (!amountChanged && !typeChanged && !accountChanged && !toAccountChanged && !feeChanged) {
                const updatePayload: any = { ...newData };
                if (newData.date) updatePayload.date = Timestamp.fromDate(new Date(newData.date));

                // Sanitize undefined
                Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

                transaction.update(txRef, updatePayload);
                return;
            }

            // --- SEPARATE READS FROM WRITES ---

            // 1. Identify all unique account IDs involved (Old and New)
            const accountIds = new Set<string>();
            accountIds.add(oldData.accountId);
            if (oldData.toAccountId) accountIds.add(oldData.toAccountId);
            accountIds.add(finalData.accountId);
            if (finalData.toAccountId) accountIds.add(finalData.toAccountId);

            // 2. Read all accounts
            const accountBalances: Record<string, number | null> = {};
            const accountRefs: Record<string, any> = {};

            for (const accId of Array.from(accountIds)) {
                if (!accId) continue;
                const ref = doc(db, ACCOUNTS_COLLECTION, accId);
                accountRefs[accId] = ref;
                const snap = await transaction.get(ref);
                if (snap.exists()) {
                    accountBalances[accId] = snap.data().balance;
                } else {
                    accountBalances[accId] = null;
                }
            }

            // 3. Perform Calculations (In Memory)

            // Revert Old Effect
            if (accountBalances[oldData.accountId] !== null) {
                let bal = accountBalances[oldData.accountId]!;
                if (oldData.type === 'transfer' && oldData.toAccountId) {
                    const oldFee = oldData.transferFee || 0;
                    bal += (oldData.amount + oldFee);
                } else if (oldData.type === 'income') {
                    bal -= oldData.amount;
                } else {
                    bal += oldData.amount;
                }
                accountBalances[oldData.accountId] = bal;
            }

            if (oldData.type === 'transfer' && oldData.toAccountId && accountBalances[oldData.toAccountId] !== null) {
                let bal = accountBalances[oldData.toAccountId]!;
                bal -= oldData.amount;
                accountBalances[oldData.toAccountId] = bal;
            }

            // Apply New Effect
            const newAmount = Number(finalData.amount);
            const newFee = finalData.transferFee ? Number(finalData.transferFee) : 0;

            if (accountBalances[finalData.accountId] !== null) {
                let bal = accountBalances[finalData.accountId]!;
                if (finalData.type === 'transfer') {
                    bal -= (newAmount + newFee);
                } else if (finalData.type === 'income') {
                    bal += newAmount;
                } else {
                    bal -= newAmount;
                }
                accountBalances[finalData.accountId] = bal;
            }

            if (finalData.type === 'transfer' && finalData.toAccountId && accountBalances[finalData.toAccountId] !== null) {
                let bal = accountBalances[finalData.toAccountId]!;
                bal += newAmount;
                accountBalances[finalData.toAccountId] = bal;
            }

            // 4. Perform Writes
            for (const accId of Array.from(accountIds)) {
                if (!accId) continue;
                if (accountBalances[accId] !== null) {
                    transaction.update(accountRefs[accId], { balance: accountBalances[accId] });
                }
            }

            // Update Transaction Doc
            const updatePayload: any = { ...newData };
            if (newData.date) updatePayload.date = Timestamp.fromDate(new Date(newData.date));

            // Sanitize undefined
            Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

            transaction.update(txRef, updatePayload);
        });
    } catch (e) {
        console.error("Update failed: ", e);
        throw e;
    }
}

export async function deleteTransaction(userId: string, transactionId: string, accountId: string, amount: number, type: string, toAccountId?: string, transferFee?: number) {
    // Reverse the balance change
    try {
        await runTransaction(db, async (transaction) => {
            const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
            const accountDoc = await transaction.get(accountRef);

            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;

                if (type === 'transfer' && toAccountId) {
                    // Reverse Transfer Source Side
                    // Source: Add back Amount + Fee
                    const fee = transferFee ? Number(transferFee) : 0;
                    const newSourceBalance = currentBalance + amount + fee;
                    transaction.update(accountRef, { balance: newSourceBalance });
                } else {
                    // Standard Reversal
                    let newBalance = currentBalance;
                    if (type === 'income') {
                        newBalance -= amount;
                    } else {
                        newBalance += amount;
                    }
                    transaction.update(accountRef, { balance: newBalance });
                }
            }

            // Handle Destination for Transfer
            if (type === 'transfer' && toAccountId) {
                const destAccountRef = doc(db, ACCOUNTS_COLLECTION, toAccountId);
                const destAccountDoc = await transaction.get(destAccountRef);

                if (destAccountDoc.exists()) {
                    const destBalance = destAccountDoc.data().balance;
                    // Dest: Remove Amount
                    const newDestBalance = destBalance - amount;
                    transaction.update(destAccountRef, { balance: newDestBalance });
                }
            }

            transaction.delete(doc(db, COLLECTION, transactionId));
        });
    } catch (e) {
        console.error("Delete failed: ", e);
        throw e;
    }
}
