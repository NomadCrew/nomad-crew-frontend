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
        <!-- <ion-button @click="signInWithFacebook" expand="block" color="primary">
          Register with Facebook
        </ion-button> -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import { useAuth } from '@/services/authService'; // Adjust path as needed

export default defineComponent({
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton
  },
  setup() {
    const email = ref('');
    const password = ref('');
    const { register, signInWithGoogle } = useAuth();

    const handleRegister = async () => {
      await register(email.value, password.value);
      // Additional logic like redirecting to another page upon successful registration
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