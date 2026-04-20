import { createApp } from 'vue'
import { router } from '@/router';
import { createPinia } from 'pinia';
import App from './App.vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import './assets/styles/main.css';
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount('#app');
