import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import OnboardingSlides from '@/views/OnboardingSlides.vue';
import LoginPage from '@/views/LoginPage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import { currentUser } from '@/services/firebase/firebase-service';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: OnboardingSlides,
    meta: { requiresAuth: true, requiresOnboarding: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresUnauth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { requiresUnauth: true }
  },
  // other routes
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const user = currentUser.value;
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  if (to.matched.some(record => record.meta.requiresAuth) && !user) {
    next({ name: 'Login' });
  } else if (to.matched.some(record => record.meta.requiresUnauth) && user) {
    next({ name: 'Home' });
  } else if (to.matched.some(record => record.meta.requiresOnboarding) && !onboardingCompleted) {
    next({ name: 'Onboarding' });
  } else if (to.path === '/register' && user) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;

