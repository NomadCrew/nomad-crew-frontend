<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Nomad Crew</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <ion-button @click="signInWithGoogle">GOOGLE AUTH</ion-button>
        <div style="margin-top: 12px">
          <ion-card>
            <ion-card-content>
              <ion-item>
                <ion-label>EMAIL</ion-label>
                <ion-input v-model="email" type="text" required></ion-input>
              </ion-item>
              <ion-item>
                <ion-label>PASSWORD</ion-label>
                <ion-input v-model="password" type="password"></ion-input>
              </ion-item>
              <ion-button @click="signIn">SIGN IN WITH EMAIL</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
        <div>
          {{ errorMessage }} 
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { 
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
} from "@ionic/vue";
import { onMounted, ref } from "vue";
import { useRouter } from 'vue-router'; 
import {
  fb_signInWithGoogle,
  fb_signInWithEmailAndPassword,
  auth
} from "@/services/firebase/firebase-service";

const email = ref("");
const password = ref("");
const errorMessage = ref(""); 
const router = useRouter();

onMounted(() => {
  // If a user is already logged in, redirect to '/private'
  if (auth.currentUser) {
    router.replace('/private'); 
  }
});

const signIn = async () => {
  try {
    await fb_signInWithEmailAndPassword(email.value, password.value);
    router.replace('/private'); // Redirect after successful sign-in
  } catch (error: any) {
    errorMessage.value = error.message; 
  }
};

const signInWithGoogle = async () => {
  try {
    await fb_signInWithGoogle();
    router.replace('/private'); // Redirect after successful sign-in
  } catch (error: any) {
    errorMessage.value = error.message;
  }
};

</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>