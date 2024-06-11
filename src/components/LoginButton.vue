<template>
  <ion-button @click="login">Log in with Google</ion-button> </template>

<script lang="ts">
import { defineComponent } from "vue";
import { IonButton } from "@ionic/vue";
import { fb_signInWithGoogle } from "@/services/firebase/firebase-service"; 

export default defineComponent({
  components: {
    IonButton,
  },
  setup() {
    const login = async () => {
      try {
        await fb_signInWithGoogle();
        // Handle successful login, e.g., redirect
      } catch (error) {
        console.error("Error logging in with Google:", error);
        // Display an error message to the user
      }
    };

    return { login };
  },
});
</script>