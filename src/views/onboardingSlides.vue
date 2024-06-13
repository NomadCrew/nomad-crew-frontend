<template>
    <ion-page>
      <ion-content>
        <swiper :slides-per-view="1" :space-between="10" :pagination="{ clickable: true }">
          <swiper-slide>
            <div class="slide-container">
              <img src="@/assets/images/LP-Doodle.png" alt="Doodle" class="background-image" />
              <div class="content">
                <h1>Nomad Crew</h1>
                <ion-button @click="completeOnboarding" color="primary">Get Started</ion-button>
              </div>
            </div>
          </swiper-slide>
          <swiper-slide>
            <h2>Welcome to NomadCrew</h2>
            <p>Discover new places with friends.</p>
          </swiper-slide>
          <swiper-slide>
            <h2>Plan your next trip</h2>
            <p>Find the best places to visit and things to do.</p>
          </swiper-slide>
          <swiper-slide>
            <h2>Share your experiences</h2>
            <p>Connect with friends and share your travel experiences.</p>
          </swiper-slide>
          <swiper-slide>
            <h2>Live location</h2>
            <p>Get live location updates of your friends!</p>
          </swiper-slide>
          <!-- Add more slides as needed -->
        </swiper>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  import { IonContent, IonPage, IonButton } from '@ionic/vue';
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import 'swiper/swiper-bundle.css';
  
  export default defineComponent({
    name: 'OnboardingSlides',
    components: { IonContent, IonPage, IonButton, Swiper, SwiperSlide },
    setup() {
      const router = useRouter();
  
      const completeOnboarding = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        router.push('/home');
      };
  
      return { completeOnboarding };
    },
  });
  </script>
  
  <style scoped>
  .slide-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    text-align: center;
  }
  
  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }
  
  .content {
    z-index: 1;
  }
  
  h1 {
    font-size: 2.5em;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  ion-button {
    --background: #ff6200;
    --background-activated: #e55a00;
    --background-focused: #e55a00;
    --background-hover: #e55a00;
  }
  </style>
  