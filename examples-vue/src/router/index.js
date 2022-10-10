import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/home',
        component: () => import('../views/home/home.vue')
    },
    // 尝试写滚动优化组件
    {
        path: '/scroll',
        component: () => import('../views/scroll/scroll.vue')
    }
];

const router = new VueRouter({
    routes
});

export default router;
