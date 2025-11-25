import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import PetUpload from '../views/PetUpload.vue';
import Filter from '../views/Filter.vue';
import Login from '../views/Login.vue';
import Nearby from '../views/Nearby.vue';
import Donate from '../views/Donate.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/pet-upload',
        name: 'PetUpload',
        component: PetUpload
    },
    {
        path: '/filter',
        name: 'Filter',
        component: Filter
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/nearby',
        name: 'Nearby',
        component: Nearby
    },
    {
        path: '/donate',
        name: 'Donate',
        component: Donate
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router

