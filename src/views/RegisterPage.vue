<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="handleRegister">
        <ion-item>
          <ion-label position="stacked">Email</ion-label>
          <ion-input v-model="email" type="email" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Password</ion-label>
          <ion-input v-model="password" type="password" required></ion-input>
        </ion-item>
        <ion-button type="submit" expand="block">Register</ion-button>
      </form>
      <div class="social-login">
        <ion-button @click="signInWithGoogle" expand="block" color="danger">
          Register with Google
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fb_createUserWithEmailAndPassword, fb_signInWithGoogle } from "@/services/firebase/firebase-service";

export default defineComponent({
  name: 'RegisterPage',
  setup() {
    const email = ref('');
    const password = ref('');
    const router = useRouter();

    const handleRegister = async () => {
      try {
        await fb_createUserWithEmailAndPassword(email.value, password.value);
        localStorage.setItem('onboardingCompleted', 'false');
        router.push('/onboarding');
      } catch (error: any) {
        console.error("Error during registration:", error);
      }
    };

    const signInWithGoogle = async () => {
      try {
        await fb_signInWithGoogle();
        localStorage.setItem('onboardingCompleted', 'false');
        router.push('/onboarding');
      } catch (error: any) {
        console.error("Error during Google sign-in:", error);
      }
    };

    return { email, password, handleRegister, signInWithGoogle };
  },
});
</script>

<style scoped>
.social-login {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}
</style>
