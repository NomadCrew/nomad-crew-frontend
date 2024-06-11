import { Capacitor } from "@capacitor/core";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, indexedDBLocalPersistence, initializeAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { ref, computed } from "vue";
import { firebaseConfig } from "./firebaseConfig";

const USER = ref<any>(null);
const APP = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

if (Capacitor.isNativePlatform()) {
  initializeAuth(APP, {
    persistence: indexedDBLocalPersistence,
  });
}

export const firestoreDB = getFirestore(APP);
export const currentUser = computed(() => (USER.value ? USER.value : null));

export const setCurrentUser = (user: any) => {
  USER.value = user?.auth ? user?.auth.currentUser : user;
  return currentUser;
};

export const newGetUser = () => {
  return new Promise(function (resolve) {
    getAuth().onAuthStateChanged(async (user) => {
      USER.value = getAuth().currentUser;
      resolve(currentUser);
    });
  });
};

export const fb_signOut = async () => {
  const auth = getAuth();
  await auth.signOut();
  await FirebaseAuthentication.signOut();
  USER.value = null;
};

export const fb_signInWithGoogle = async () => {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const credential = GoogleAuthProvider.credential(result.credential?.idToken);
    await signInWithCredential(getAuth(), credential);
    USER.value = getAuth().currentUser;
    return currentUser;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};
