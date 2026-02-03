import { db } from "./firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";
import { Budget } from "@/types";

const COLLECTION = "budgets";

export async function getBudgets(userId: string): Promise<Budget[]> {
    const q = query(
        collection(db, COLLECTION),
        where("ownerId", "==", userId),
        orderBy("categoryName", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Budget));
}

export async function addBudget(userId: string, data: Omit<Budget, "id" | "ownerId" | "createdAt" | "updatedAt">) {
    return addDoc(collection(db, COLLECTION), {
        ...data,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updateBudget(id: string, data: Partial<Budget>) {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteBudget(id: string) {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
}
