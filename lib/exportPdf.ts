import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Account } from "@/types";
import { formatCurrency } from "./utils";

export function exportTransactionsToPDF(
    transactions: Transaction[],
    accounts: Account[],
    dateRange?: { start: Date | null, end: Date | null }
) {
    // 1. Calculate Summaries
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expense;

    // Create Account Map
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));

    // 2. Initialize PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 3. Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Transaction Report", 14, 22);

    let currentY = 30;

    // Period Header
    if (dateRange?.start && dateRange?.end) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const startStr = dateRange.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const endStr = dateRange.end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Period: ${startStr} - ${endStr}`, 14, currentY);
        currentY += 6;
    }

    // 4. Generated Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Generated on: ${dateStr}`, 14, currentY);
    currentY += 5;

    // 5. Summary Section
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, pageWidth - 14, currentY);

    const startY = currentY + 10;

    // Income
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Total Income", 14, startY);
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(formatCurrency(income), 14, startY + 7);

    // Expense
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Total Expenses", 80, startY);
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(formatCurrency(expense), 80, startY + 7);

    // Net
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Net Balance", 146, startY);
    doc.setFontSize(12);
    doc.setTextColor(net >= 0 ? 34 : 239, net >= 0 ? 197 : 68, net >= 0 ? 94 : 68); // Green/Red
    doc.text(formatCurrency(net), 146, startY + 7);

    doc.line(14, startY + 15, pageWidth - 14, startY + 15);

    // 6. Table
    // Prepare Data
    // Sort descending by date
    const sortedTxs = [...transactions].sort((a, b) => b.date.seconds - a.date.seconds);

    const tableData = sortedTxs.map(tx => {
        const date = new Date(tx.date.seconds * 1000).toLocaleDateString();
        const accountName = accountMap.get(tx.accountId) || "Unknown Account";
        return [
            date,
            tx.description || "-",
            tx.categoryName || "-",
            tx.type === 'income' ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`,
            accountName
        ];
    });

    autoTable(doc, {
        startY: startY + 25,
        head: [['Date', 'Description', 'Category', 'Amount', 'Account']],
        body: tableData,
        headStyles: {
            fillColor: [35, 41, 54], // Dark blue/gray matching theme
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: 50
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: 'auto' }, // Desc
            2: { cellWidth: 30 }, // Category
            3: { cellWidth: 35, halign: 'right' }, // Amount
            4: { cellWidth: 30 } // Account
        },
        margin: { top: 20 }
    });

    // 7. Save
    const filenameDate = new Date().toISOString().split('T')[0];
    doc.save(`money-vault-report-${filenameDate}.pdf`);
}
