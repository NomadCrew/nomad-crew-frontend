import { ref } from 'vue';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '@/firebase/firebaseConfig';

const auth = getAuth(app);

export function useAuth() {
  const error = ref(null);

  const login = async (email: string, password: string) => {
    error.value = null; // Reset error

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in');
    } catch (err: any) {
      console.error('Login error:', err);
      error.value = err.message;
    }
  };

  return { error, login };
}
