/**
 * Cliente axios centralizado.
 * 
 * withCredentials: true → envía cookies en cada petición (crítico para la sesión)
 * baseURL: /api → el proxy de Vite redirige al backend
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// Interceptor de respuesta: si el backend devuelve 401,
// redirigimos al login automáticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api