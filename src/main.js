import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.sessionStorage.setItem('asulazi-auto-refresh', String(Date.now()))
    window.location.reload()
  }
})

if (import.meta.env.DEV) {
  import('./db.js').then(({ db }) => {
    window.__db = db
  })
}

// iOS standalone web app can drift horizontally when the keyboard opens; snap back.
window.addEventListener('scroll', () => {
  if (window.scrollX !== 0) window.scrollTo(0, window.scrollY)
})

createApp(App).mount('#app')
