export type AccountType = 'Checking' | 'Savings' | 'Credit' | 'Investment' | 'Cash' | 'Loan';

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    bgGradient?: string; // CSS class or hex code for visual flair
    ownerId: string;
    createdAt?: any; // Firestore Timestamp
    updatedAt?: any;
}


export const ACCOUNT_TYPES: AccountType[] = ['Checking', 'Savings', 'Credit', 'Investment', 'Cash', 'Loan'];

export interface Category {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    type: 'income' | 'expense';
    ownerId: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
    id: string;
    amount: number;
    description: string;
    date: any; // Firestore Timestamp
    type: TransactionType;
    accountId: string;
    categoryId?: string;
    categoryName?: string; // Cache for display
    ownerId: string;
    notes?: string;
    createdAt: any;
}

export interface Budget {
    id: string;
    categoryName: string;
    amount: number;
    ownerId: string;
    createdAt: any;
    updatedAt: any;
}

export interface UserSettings {
    cycleStartDay: number; // 1-31
    currency?: string;
    language?: string;
    theme?: 'dark' | 'light';
}

export const DEFAULT_CATEGORIES = [
    { name: 'Salary', type: 'income', color: '#10B981', icon: 'Wallet' },
    { name: 'Freelance', type: 'income', color: '#34D399', icon: 'Laptop' },
    { name: 'Housing', type: 'expense', color: '#F87171', icon: 'Home' },
    { name: 'Food', type: 'expense', color: '#FBBF24', icon: 'Utensils' },
    { name: 'Transportation', type: 'expense', color: '#60A5FA', icon: 'Car' },
    { name: 'Utilities', type: 'expense', color: '#A78BFA', icon: 'Zap' },
    { name: 'Entertainment', type: 'expense', color: '#F472B6', icon: 'Film' },
    { name: 'Health', type: 'expense', color: '#EF4444', icon: 'Heart' },
    { name: 'Shopping', type: 'expense', color: '#F59E0B', icon: 'ShoppingBag' },
];
