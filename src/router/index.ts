import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { currentUser } from '@/services/firebase/firebase-service';
import HomePage from '@/views/HomePage.vue';
import OnboardingSlides from '@/views/onboardingSlides.vue';

// Modify the guard to check for Firebase currentUser
const guard = async (to: any, from: any, next: any) => {
  // Assuming currentUser is a ref or computed property
  const loggedIn = !!currentUser.value;

  if (to.meta?.requiresAuth && !loggedIn) {
    next('/login');
  } else if (to.path === '/login' && loggedIn) {
    next('/home');
  } else {
    next();
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home' 
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue')
  },
  {
    path: "/private",
    name: "private-page",
    component: OnboardingSlides,
    meta: { requiresAuth: true }, // Require authentication for this route
    beforeEnter: guard, // Apply the authentication guard
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true }, // Require authentication for tab routes
    children: [
      // ... (your tab routes remain the same)
    ]
  },
  // ... (other routes)
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Apply the guard globally
router.beforeEach(guard);

export default router;