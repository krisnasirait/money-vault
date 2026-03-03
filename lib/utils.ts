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

    // Helper to get max days in a specific month
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

    const currentMonthMax = getDaysInMonth(year, month);
    const effectiveStartDayThisMonth = Math.min(startDay, currentMonthMax);

    // If current day is >= effective startDay, we are in the cycle that started THIS month.
    if (day >= effectiveStartDayThisMonth) {
        start = new Date(year, month, effectiveStartDayThisMonth);
        const nextMonthMax = getDaysInMonth(year, month + 1);
        const effectiveEndDayNextMonth = Math.min(startDay, nextMonthMax);
        end = new Date(year, month + 1, effectiveEndDayNextMonth - 1);
    }
    // If current day < effective startDay, we are in the cycle that started LAST month.
    else {
        const prevMonthMax = getDaysInMonth(year, month - 1);
        const effectiveStartDayPrevMonth = Math.min(startDay, prevMonthMax);
        start = new Date(year, month - 1, effectiveStartDayPrevMonth);

        const effectiveEndDayThisMonth = Math.min(startDay, currentMonthMax);
        end = new Date(year, month, effectiveEndDayThisMonth - 1);
    }

    // Normalize times
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

export function formatCycleLabel(cycleRange: { start: Date; end: Date }, cycleStartDay: number): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const startStr = cycleRange.start.toLocaleDateString('en-GB', options);
    const endStr = cycleRange.end.toLocaleDateString('en-GB', options);
    return `${startStr} - ${endStr}`;
}
