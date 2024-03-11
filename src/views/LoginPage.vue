<template>
<ion-toast
    :is-open="showToast"
    :message="toastMessage"
    duration="2000"
  ></ion-toast>
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
      <!-- Display error messages -->
      <ion-text color="danger" v-if="loginError">{{ loginError }}</ion-text>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonToast } from '@ionic/vue';
import { defineComponent, ref, watch } from 'vue';
import { useAuth } from '@/services/authService';

export default defineComponent({
  name: 'LoginPage',
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonToast
  },
  setup() {
    const { login, signInWithGoogle, error } = useAuth();
    const email = ref('');
    const password = ref('');
    const showToast = ref(false);
    const toastMessage = ref('');

    const handleLogin = async () => {
    try{
      await login(email.value, password.value);
      }
      catch(err) {
        toastMessage.value = err.message;
        showToast.value = true;
      }
    };

    const handleGoogleSignIn = async () => {
      await signInWithGoogle();
    };

    watch(error, async (newError) => {
      if (newError) {
        toastMessage.value = newError;
        showToast.value = true;
      }
    });

    return { email, password, handleLogin, handleGoogleSignIn, showToast, toastMessage };
  },
});
</script>
