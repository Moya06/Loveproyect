export const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : '/api'
export const APP_NAME = 'Nuestro Amor'
