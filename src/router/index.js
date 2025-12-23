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
        path: '/adoption/:id',
        name: 'Adoption',
        component: () => import('../views/Adoption.vue')
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        beforeEnter: requireAdmin
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router

