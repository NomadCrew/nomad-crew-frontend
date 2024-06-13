import { createRouter, createWebHashHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import OnboardingSlides from '@/views/OnboardingSlides.vue';
import LoginPage from '@/views/LoginPage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import { currentUser, newGetUser } from '@/services/firebase/firebase-service';

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
  }
];

const router = createRouter({
  history: createWebHashHistory((import.meta as any).env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  await newGetUser();
  const user = currentUser.value;
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  if (to.path === '/login' && user) {
    return next('/home'); // Redirect authenticated users away from login
  } else if (to.matched.some(record => record.meta.requiresAuth) && !user) {
    return next('/login'); // Redirect unauthenticated users to login
  } else if (to.matched.some(record => record.meta.requiresOnboarding) && !onboardingCompleted && to.path !== '/onboarding') {
    return next('/onboarding'); // Redirect for onboarding, avoiding infinite loop by checking current path
  } else {
    next(); // Proceed as normal
  }
});

export default router;
