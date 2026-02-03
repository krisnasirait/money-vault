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

            // 2. Get account reference
            const accountRef = doc(db, ACCOUNTS_COLLECTION, data.accountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw "Account does not exist!";
            }

            const currentBalance = accountDoc.data().balance;
            const amount = Number(data.amount);

            // 3. Calculate new balance
            // Income adds to balance, Expense subtracts
            // If type is 'expense', amount should logically be subtracted. 
            // USUALLY inputs are positive numbers. Let's assume input 'amount' is positive.
            let newBalance = currentBalance;
            if (data.type === 'income') {
                newBalance += amount;
            } else {
                newBalance -= amount;
            }

            // 4. Write Transaction
            transaction.set(newTxRef, {
                ...data,
                ownerId: userId,
                date: Timestamp.fromDate(new Date(data.date)),
                createdAt: serverTimestamp(),
            });

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

            // Check if balance-affecting fields changed
            const amountChanged = newData.amount !== undefined && newData.amount !== oldData.amount;
            const typeChanged = newData.type !== undefined && newData.type !== oldData.type;
            const accountChanged = newData.accountId !== undefined && newData.accountId !== oldData.accountId; // Not supporting account move yet for simplicity, or we can?

            // If nothing affects balance, just simple update
            if (!amountChanged && !typeChanged && !accountChanged) {
                transaction.update(txRef, {
                    ...newData,
                    date: newData.date ? Timestamp.fromDate(new Date(newData.date)) : undefined
                    // Clean undefined
                });
                return;
            }

            // Complex update: Revert old effect, apply new effect
            // 1. Revert Old
            const oldAccountRef = doc(db, ACCOUNTS_COLLECTION, oldData.accountId);
            const oldAccountDoc = await transaction.get(oldAccountRef);
            if (!oldAccountDoc.exists()) throw "Old Account not found";

            let oldBalance = oldAccountDoc.data().balance;
            let intermediateBalance = oldBalance;

            if (oldData.type === 'income') {
                intermediateBalance -= oldData.amount;
            } else {
                intermediateBalance += oldData.amount;
            }

            // 2. Apply New
            // Note: If account changed, we need to handle two accounts. For MVP, let's assume account change IS supported.
            let targetAccountRef = oldAccountRef;
            let targetBalance = intermediateBalance;

            if (accountChanged && newData.accountId) {
                // If account changed, we need to:
                // a. Update OLD account with reverted balance (intermediateBalance)
                transaction.update(oldAccountRef, { balance: intermediateBalance });

                // b. Get NEW account
                targetAccountRef = doc(db, ACCOUNTS_COLLECTION, newData.accountId);
                const targetAccountDoc = await transaction.get(targetAccountRef);
                if (!targetAccountDoc.exists()) throw "New Account not found";
                targetBalance = targetAccountDoc.data().balance;
            }

            // Calculate final effect on target account
            const newAmount = newData.amount !== undefined ? Number(newData.amount) : oldData.amount;
            const newType = newData.type !== undefined ? newData.type : oldData.type;

            if (newType === 'income') {
                targetBalance += newAmount;
            } else {
                targetBalance -= newAmount;
            }

            // Update Target Account
            transaction.update(targetAccountRef, { balance: targetBalance });

            // Update Old Account (only if account changed, we effectively did it above by splitting logic)
            // But wait, if account NOT changed, targetAccountRef === oldAccountRef, so we update it once with final state.
            // If account CHANGED, we updated oldAccountRef with 'intermediateBalance' (reverted state) and now updating targetAccountRef.

            // Update Transaction Doc
            const updatePayload: any = { ...newData };
            if (newData.date) updatePayload.date = Timestamp.fromDate(new Date(newData.date));

            transaction.update(txRef, updatePayload);
        });
    } catch (e) {
        console.error("Update failed: ", e);
        throw e;
    }
}

export async function deleteTransaction(userId: string, transactionId: string, accountId: string, amount: number, type: string) {
    // Reverse the balance change
    try {
        await runTransaction(db, async (transaction) => {
            const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) throw "Account not found";

            const currentBalance = accountDoc.data().balance;
            let newBalance = currentBalance;

            // Reverse logic: if it was income, we remove it (subtract). If expense, we add it back.
            if (type === 'income') {
                newBalance -= amount;
            } else {
                newBalance += amount;
            }

            transaction.delete(doc(db, COLLECTION, transactionId));
            transaction.update(accountRef, { balance: newBalance });
        });
    } catch (e) {
        console.error("Delete failed: ", e);
        throw e;
    }
}
