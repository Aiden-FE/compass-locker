import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('~/views/home/home.vue');
const PageOne = () => import('~/views/page-one.vue');
const PageTwo = () => import('~/views/page-two.vue');

const routes = [
  { path: '/', component: Home },
  { path: '/page-one', component: PageOne },
  { path: '/page-two', component: PageTwo },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  next();
});

router.afterEach(() => {
});

export default router;
