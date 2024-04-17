<template>
    <ion-page>
        <ion-content>
            <swiper :slides-per-view="1" :space-between="10" :pagination="{ clickable: true }">
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
            <ion-button @click="completeOnboarding">Get Started</ion-button>
        </ion-content>
    </ion-page>
</template>

<script>
import { IonContent, IonPage, IonButton } from '@ionic/vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/swiper-bundle.css';
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    components: { IonContent, IonPage, IonButton, Swiper, SwiperSlide },
    setup() {
        const router = useRouter();

        const completeOnboarding = () => {
            localStorage.setItem('onboardingCompleted', 'true');
            router.push('/home'); // Navigate to the home screen or dashboard
        };

        return { completeOnboarding };
    },
});
</script>