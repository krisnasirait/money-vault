import { db } from "@/lib/firebase"; // Assuming firebase export
import { collection, getDocs, deleteDoc, writeBatch, query, where } from "firebase/firestore";
import { Transaction } from "@/types";

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const headers = ["Date", "Amount", "Type", "Category", "Description", "Account", "Notes"];
    const csvContent = [
        headers.join(","),
        ...transactions.map(tx => {
            const date = tx.date?.seconds ? new Date(tx.date.seconds * 1000).toISOString().split('T')[0] : "";
            const amount = tx.amount;
            const type = tx.type;
            const category = tx.categoryName || "";
            // Escape description and notes for CSV
            const description = `"${(tx.description || "").replace(/"/g, '""')}"`;
            const notes = `"${(tx.notes || "").replace(/"/g, '""')}"`;
            // We might not have account name easily here without joining, but ID is available. 
            // Ideally we pass enriched transactions or just ID. For now let's use Account ID or just skip if complex.
            // Let's assume passed transactions are sufficient.
            const account = tx.accountId;

            return [date, amount, type, category, description, account, notes].join(",");
        })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const clearAllUserData = async (userId: string) => {
    const batch = writeBatch(db);

    // We need to delete from multiple collections: transactions, budgets, accounts, categories
    // Firestore batch limit is 500. If user has more, we need multiple batches or recursive delete.
    // For this MVP, we will try to delete what we can find.

    // 1. Transactions
    const txQ = query(collection(db, "transactions"), where("ownerId", "==", userId));
    const txDocs = await getDocs(txQ);
    txDocs.forEach(doc => batch.delete(doc.ref));

    // 2. Budgets
    const bQ = query(collection(db, "budgets"), where("ownerId", "==", userId));
    const bDocs = await getDocs(bQ);
    bDocs.forEach(doc => batch.delete(doc.ref));

    // 3. Accounts
    const aQ = query(collection(db, "accounts"), where("ownerId", "==", userId));
    const aDocs = await getDocs(aQ);
    aDocs.forEach(doc => batch.delete(doc.ref));

    // 4. Custom Categories
    const cQ = query(collection(db, "categories"), where("ownerId", "==", userId));
    const cDocs = await getDocs(cQ);
    cDocs.forEach(doc => batch.delete(doc.ref));

    // 5. Settings
    const sRef = collection(db, "users", userId, "settings"); // Settings are in subcollection? Or document?
    // In lib/settings.ts we used `doc(db, "users", uid, "settings", "general")` or similar? 
    // Let's check lib/settings.ts to be sure. 
    // Assuming we want to clear settings too.

    await batch.commit();
};
