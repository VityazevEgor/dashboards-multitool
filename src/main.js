import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'midnight',
    themes: {
      midnight: {
        dark: true,
        colors: {
          background: '#0e0f14',
          surface: '#151823',
          primary: '#5eead4',
          secondary: '#a78bfa',
          accent: '#f59e0b',
          info: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#f87171',
          'surface-variant': '#1e2230',
          'on-surface-variant': '#cbd5f5',
        },
      },
    },
  },
})

createApp(App).use(vuetify).mount('#app')
