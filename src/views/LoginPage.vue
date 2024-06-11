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
      <p>
          Don't have an account? 
          <router-link :to="{ name: 'RegisterPage' }">Register</router-link>
        </p>

      <ion-button @click="signInWithGoogle" expand="block" color="danger">
        Login with Google
      </ion-button>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton 
} from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router'; 
import { fb_signInWithGoogle, fb_signInWithEmailAndPassword } from '@/services/firebase/firebase-service';

export default defineComponent({
  name: 'LoginPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
  },
  setup() {
    const email = ref('');
    const password = ref('');
    const errorMessage = ref('');
    const router = useRouter();

    const handleLogin = async () => {
      try {
        await fb_signInWithEmailAndPassword(email.value, password.value);
        router.push('/private'); // Or your protected route
      } catch (error: any) {
        errorMessage.value = error.message;
      }
    };

    const signInWithGoogle = async () => {
      try {
        await fb_signInWithGoogle();
        router.push('/private'); // Or your protected route
      } catch (error: any) {
        errorMessage.value = error.message;
      }
    };

    return {
      email,
      password,
      handleLogin,
      signInWithGoogle,
      errorMessage,
    };
  },
});
</script>