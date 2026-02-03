import { db } from "./firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { Category } from "@/types";

const COLLECTION = "custom_categories";

export async function getCustomCategories(userId: string): Promise<Category[]> {
    const q = query(
        collection(db, COLLECTION),
        where("ownerId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Category));
}

export async function addCategory(userId: string, category: Omit<Category, "id" | "ownerId">) {
    return addDoc(collection(db, COLLECTION), {
        ...category,
        ownerId: userId,
        createdAt: serverTimestamp(),
    });
}

export async function deleteCategory(id: string) {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
}
