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
    serverTimestamp
} from "firebase/firestore";
import { Account } from "@/types";

const COLLECTION = "accounts";

export async function getAccounts(userId: string): Promise<Account[]> {
    const q = query(
        collection(db, COLLECTION),
        where("ownerId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Account));
}

export async function addAccount(userId: string, data: Omit<Account, "id" | "ownerId" | "createdAt" | "updatedAt">) {
    return addDoc(collection(db, COLLECTION), {
        ...data,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updateAccount(id: string, data: Partial<Account>) {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteAccount(id: string) {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
}
