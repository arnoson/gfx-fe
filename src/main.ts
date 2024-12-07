import './assets/main.css'

import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { parse, stringify } from 'superjson'

const pinia = createPinia()
pinia.use(
  createPersistedState({
    serializer: {
      serialize: stringify,
      deserialize: parse,
    },
  }),
)

const app = createApp(App)
app.use(pinia)
app.mount('#app')
