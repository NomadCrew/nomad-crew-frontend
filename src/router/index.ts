import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { useAuth } from '@/services/authService';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
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

router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated.value) {
    next('/login');
  } else {
    next();
  }
});

export default router;
