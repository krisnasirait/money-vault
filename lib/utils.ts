export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function getCycleRange(referenceDate: Date, startDay: number): { start: Date, end: Date } {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    let start: Date;
    let end: Date;

    // If current day is >= startDay, we are in the cycle that started THIS month.
    // e.g. Ref: Jan 10, Start: 5. Range: Jan 5 - Feb 4.
    if (day >= startDay) {
        start = new Date(year, month, startDay);
        end = new Date(year, month + 1, startDay - 1); // End is day before next start
        end.setHours(23, 59, 59, 999);
    }
    // If current day < startDay, we are in the cycle that started LAST month.
    // e.g. Ref: Jan 2, Start: 5. Range: Dec 5 - Jan 4.
    else {
        start = new Date(year, month - 1, startDay);
        end = new Date(year, month, startDay - 1);
        end.setHours(23, 59, 59, 999);
    }

    // Normalize start time
    start.setHours(0, 0, 0, 0);

    return { start, end };
}
