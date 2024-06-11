<template>
  <ion-button @click="onLogout">Log out</ion-button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { IonButton } from "@ionic/vue";
import { fb_signOut } from "@/services/firebase/firebase-service"; 

export default defineComponent({
  components: {
    IonButton,
  },
  setup() {
    const onLogout = async () => {
      try {
        await fb_signOut(); 
        // Handle successful logout, e.g., redirect
      } catch (error) {
        console.error("Error logging out:", error);
        // Display an error message to the user
      }
    };

    return { onLogout };
  },
});
</script>