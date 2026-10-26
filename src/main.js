import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import 'virtual:pwa-register'

if (import.meta.env.DEV) {
  import('./db.js').then(({ db }) => {
    window.__db = db
  })
}

createApp(App).mount('#app')
