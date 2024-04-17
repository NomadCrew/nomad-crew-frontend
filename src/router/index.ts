import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { currentUser } from '@/firebase/firebase-service';
import HomePage from '@/views/HomePage.vue';
import OnboardingSlides from '@/views/onboardingSlides.vue';

const guard = async (to: any, from: any, next: any) => {
  const loggedIn = !!currentUser?.value?.uid;
  if (loggedIn && ["home", "index"].includes(to.name)) {
    return next({ name: "private-page" });
  } else if (!loggedIn && ["home", "index"].includes(to.name)) {
    return next();
  } else if (!loggedIn) {
    return next({ name: "home" });
  } else {
    return next();
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
    beforeEnter: guard
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    beforeEnter: guard
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue')
  },
  // {
  //   path: '/protected-route',
  //   component: () => import('@/views/ProtectedView.vue'),
  //   meta: { requiresAuth: true }
  // },  
  {
    path: "/private",
    name: "private-page",
    component: OnboardingSlides,
    beforeEnter: guard,
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue') // Group Management
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue') // Live Location
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue') // Chat
      },
      // Add new tabs or routes for additional features as needed
    ]
  },
  // Define routes for other features outside the tab structure here
  // {
  //   path: '/expense-management',
  //   component: () => import('@/views/ExpenseManagementPage.vue')
  // },
  // More routes can be added here
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})


export default router;
