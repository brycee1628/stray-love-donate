import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import PetUpload from '../views/PetUpload.vue';
import Filter from '../views/Filter.vue';
import Login from '../views/Login.vue';
import Nearby from '../views/Nearby.vue';
import { requireAuth, requireAdmin, redirectIfAuthenticated } from './guards.js';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/pet-upload',
        name: 'PetUpload',
        component: PetUpload,
        beforeEnter: requireAuth
    },
    {
        path: '/filter',
        name: 'Filter',
        component: Filter
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        beforeEnter: redirectIfAuthenticated
    },
    {
        path: '/nearby',
        name: 'Nearby',
        component: Nearby
    },
    {
        path: '/nearby/:siteId',
        name: 'SiteDetail',
        component: () => import('../views/SiteDetail.vue')
    },
    {
        path: '/adoption/:id',
        name: 'Adoption',
        component: () => import('../views/Adoption.vue'),
        beforeEnter: requireAuth
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        beforeEnter: requireAdmin
    },
    {
        path: '/admin/pet-review',
        name: 'PetReview',
        component: () => import('../views/PetReview.vue'),
        beforeEnter: requireAdmin
    },
    {
        path: '/admin/user-management',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        beforeEnter: requireAdmin
    },
    {
        path: '/admin/audit-log',
        name: 'AuditLog',
        component: () => import('../views/AuditLog.vue'),
        beforeEnter: requireAdmin
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue'),
        beforeEnter: requireAuth
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router

