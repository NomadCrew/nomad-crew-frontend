<template>
  <div v-if="isLoading">Loading ...</div>
  <div v-else-if="!user"></div>
  <div v-else class="profile-container">
    <ion-avatar>
      <img :src="userPhoto" :alt="userName" />
    </ion-avatar>
    <h2>{{ userName }}</h2>
    <p>{{ userEmail }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { IonAvatar } from "@ionic/vue";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

export default defineComponent({
  components: {
    IonAvatar,
  },
  setup() {
    const user = ref<User | null>(null);
    const isLoading = ref(true);

    onMounted(() => {
      const auth = getAuth();
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        isLoading.value = false;
      });
    });

    const userPhoto = computed(() => user.value?.photoURL || '');
    const userName = computed(() => user.value?.displayName || 'User');
    const userEmail = computed(() => user.value?.email || '');

    return { user, isLoading, userPhoto, userName, userEmail };
  },
});
</script>

<style scoped>
.profile-container {
  text-align: center;
  margin-top: 20px;
}
</style>
