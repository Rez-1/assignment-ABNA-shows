import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(createPinia()).use(createAppRouter(createWebHistory())).mount('#app')
