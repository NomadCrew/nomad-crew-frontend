<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="handleLogin">
        <ion-item>
          <ion-label position="stacked">Email</ion-label>
          <ion-input v-model="email" type="email" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Password</ion-label>
          <ion-input v-model="password" type="password" required></ion-input>
        </ion-item>
        <ion-button type="submit" expand="block">Login</ion-button>
      </form>
      <ion-button @click="signInWithGoogle" expand="block" color="danger">
        Sign in with Google
      </ion-button>
      <ion-text color="danger" v-if="loginError">{{ loginError }}</ion-text>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fb_signInWithEmailAndPassword, fb_signInWithGoogle } from "@/services/firebase/firebase-service";

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const email = ref('');
    const password = ref('');
    const loginError = ref('');
    const router = useRouter();

    const handleLogin = async () => {
      try {
        await fb_signInWithEmailAndPassword(email.value, password.value);
        const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
        if (onboardingCompleted) {
          router.push('/home');
        } else {
          router.push('/onboarding');
        }
      } catch (error: any) {
        loginError.value = error.message;
        console.error("Error logging in with email:", error);
      }
    };

    const signInWithGoogle = async () => {
      try {
        await fb_signInWithGoogle();
        const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
        if (onboardingCompleted) {
          router.push('/home');
        } else {
          router.push('/onboarding');
        }
      } catch (error: any) {
        loginError.value = error.message;
        console.error("Error logging in with Google:", error);
      }
    };

    return { email, password, handleLogin, signInWithGoogle, loginError };
  },
});
</script>
