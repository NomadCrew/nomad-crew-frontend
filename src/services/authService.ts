import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { nextTick, ref } from 'vue';
import app from '@/firebase/firebaseConfig';

const isAuthenticated = ref(false);
const error = ref(null);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const handleError = async (err: any) => {
    console.error('Login error:', err);
    error.value = null;
    await nextTick();
    error.value = err.message;
    return error.value;
}

const signInWithGoogle = async () => {
    try {
        const result = await signInWithRedirect(auth, provider);
        const token = await (result as any).user.getIdToken();
        const user = (result as any).user;
    } catch (err: any) {
        await handleError(err);
    }
};

const logout = async () => {
    try {
        await auth.signOut();
        console.log('User logged out');
    } catch (err: any) {
        await handleError(err);
    }
};

const register = async (email: string, password: string) => {
    try {
        const user = await createUserWithEmailAndPassword(auth, email, password);
        console.log(user);
    } catch (err: any) {
        await handleError(err);
    }
};

const login = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in');
    } catch (err: any) {
        await handleError(err);
    }
};

onAuthStateChanged(auth, async (user) => {
    isAuthenticated.value = !!user;
    if (user) {
        try {
            const result = await getRedirectResult(auth);
            const token = await result?.user.getIdToken();
        }
        catch (err: any) {
            await handleError(err);
        }
    }
});

export function useAuth() {
    return { isAuthenticated, signInWithGoogle, register, login, error };
}
