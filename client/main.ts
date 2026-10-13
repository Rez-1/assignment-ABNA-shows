import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import { createMemory } from './shared/api/remember'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(createMemory()).use(createAppRouter(createWebHistory())).mount('#app')
