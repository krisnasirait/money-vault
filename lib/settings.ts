import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserSettings } from "@/types";

const COLLECTION = "user_settings";

export async function getUserSettings(userId: string): Promise<UserSettings> {
    const docRef = doc(db, COLLECTION, userId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        return snapshot.data() as UserSettings;
    } else {
        // Default settings
        return {
            cycleStartDay: 1,
            currency: 'USD ($)',
            language: 'English (US)',
            theme: 'dark'
        };
    }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>) {
    const docRef = doc(db, COLLECTION, userId);
    // Use setDoc with merge: true to handle both create and update
    await setDoc(docRef, settings, { merge: true });
}
