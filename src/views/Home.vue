<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Explore Vancouver</ion-title>
          <ion-buttons slot="end">
            <ion-avatar>
              <img src="@/assets/user-avatar.jpg" alt="User Avatar" />
            </ion-avatar>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="search-container">
          <ion-searchbar placeholder="Search"></ion-searchbar>
        </div>
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
    </ion-page>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonAvatar, IonContent, IonFooter, IonTabBar, IonTabButton, IonIcon, IonSearchbar } from '@ionic/vue';
  
  export default defineComponent({
    name: 'Home',
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
      IonSearchbar
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
  