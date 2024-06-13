<template>
  <ion-page ref="ionPageRef">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ cityName ? `Explore ${cityName}` : 'Explore' }}</ion-title>
        <ion-buttons slot="end">
          <ion-avatar @click="showPopover = true">
            <img :src="avatarUrl" alt="User Avatar" />
          </ion-avatar>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="search-container">
        <ion-searchbar placeholder="Search"></ion-searchbar>
      </div>
      <ion-button @click="requestGeolocation">Get Geolocation</ion-button>
    </ion-content>
    <ion-footer>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <ion-icon name="home-outline"></ion-icon>
        </ion-tab-button>
        <ion-tab-button tab="groups" href="/groups">
          <ion-icon name="people-outline"></ion-icon>
        </ion-tab-button>
        <ion-tab-button tab="chat" href="/chat">
          <ion-icon name="chatbubbles-outline"></ion-icon>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-footer>

    <ion-popover :is-open="showPopover" @ionPopoverDidDismiss="showPopover = false">
      <ion-content>
        <ion-list>
          <ion-item @click="goToProfile">Profile</ion-item>
          <ion-item @click="goToPreferences">Preferences</ion-item>
          <ion-item @click="confirmLogout">Logout</ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>

    <ion-alert
      :is-open="showAlert"
      header="Logout"
      message="Are you sure you want to log out?"
      :buttons="alertButtons"
    ></ion-alert>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonAvatar, IonContent, IonFooter, IonTabBar, IonTabButton, IonIcon, IonSearchbar, IonPopover, IonList, IonItem, IonAlert, IonButton } from '@ionic/vue';
import { Geolocation } from '@capacitor/geolocation';
import { fb_signOut } from '@/services/firebase/firebase-service';
import { addIcons } from 'ionicons';
import { personCircleOutline, settingsOutline, logOutOutline, homeOutline, peopleOutline, chatbubblesOutline } from 'ionicons/icons';

addIcons({
  'person-circle-outline': personCircleOutline,
  'settings-outline': settingsOutline,
  'log-out-outline': logOutOutline,
  'home-outline': homeOutline,
  'people-outline': peopleOutline,
  'chatbubbles-outline': chatbubblesOutline,
});

export default defineComponent({
  name: 'HomePage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonAvatar,
    IonContent,
    IonFooter,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonSearchbar,
    IonPopover,
    IonList,
    IonItem,
    IonAlert,
    IonButton,
  },
  setup() {
    const cityName = ref('');
    const showPopover = ref(false);
    const showAlert = ref(false);
    const ionPageRef = ref(null);
    const router = useRouter();

    const user = ref({ firstName: 'Nomad', lastName: 'Crew' });

    const avatarUrl = computed(() => {
      return `https://avatar.iran.liara.run/username?username=${user.value.firstName}+${user.value.lastName}`;
    });

    const getCityName = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await response.json();
        console.log(data);
        cityName.value = data.city || 'Unknown';
      } catch (error) {
        console.error('Error fetching city name:', error);
      }
    };

    const requestGeolocation = async () => {
      try {
        const position = await Geolocation.getCurrentPosition();
        getCityName(position.coords.latitude, position.coords.longitude);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    const goToProfile = () => {
      showPopover.value = false;
      router.push('/profile');
    };

    const goToPreferences = () => {
      showPopover.value = false;
      router.push('/preferences');
    };

    const confirmLogout = () => {
      showPopover.value = false;
      showAlert.value = true;
    };

    const logout = async () => {
      await fb_signOut();
      showAlert.value = false;
      router.push('/login');
    };

    const alertButtons = [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          showAlert.value = false;
        }
      },
      {
        text: 'Logout',
        handler: logout
      }
    ];

    return { cityName, showPopover, showAlert, goToProfile, goToPreferences, confirmLogout, alertButtons, ionPageRef, avatarUrl, user, requestGeolocation };
  }
});
</script>

<style scoped>
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

ion-avatar {
  margin: 0 15px;
}
</style>
