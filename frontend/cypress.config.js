import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1336,
    viewportHeight: 900,
    video: false,
  },
})

//