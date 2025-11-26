import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://chat-backend-5wt4.onrender.com',
  withCredentials: true,
  timeout: 90000, // 90 seconds to handle Render cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Track if we're currently refreshing token to avoid multiple refresh calls
let isRefreshing = false
let refreshAttempts = 0
const MAX_REFRESH_ATTEMPTS = 2 // Reduced to 2 to avoid hitting rate limit
let lastRefreshAttempt = 0
const REFRESH_COOLDOWN_MS = 2000 // 2 second cooldown between attempts
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

// Export function to reset refresh attempts on successful login
export const resetRefreshAttempts = () => {
  refreshAttempts = 0
  lastRefreshAttempt = 0
}

// Debug function to test API connection
export const testAPIConnection = async () => {
  try {
    const response = await api.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Health check failed:', error);
    return { success: false, error };
  }
}

// Utility to wake up Render service (for cold starts)
export const wakeUpServer = async (): Promise<boolean> => {
  try {
    console.log('🌅 Waking up server (cold start)...');
    await api.get('/health', { 
      timeout: 90000 // 90 seconds for cold start
    });
    console.log('✅ Server is awake!');
    return true;
  } catch (error) {
    console.warn('⚠️ Server wake-up failed:', error);
    return false;
  }
}

// Enhanced API call with cold start handling
export const apiWithColdStartHandling = {
  async get(url: string, config?: object) {
    try {
      return await api.get(url, { timeout: 90000, ...config });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        console.log('🕒 Request timed out, server might be starting...');
        throw new Error('Server is starting up, please wait a moment and try again');
      }
      throw error;
    }
  },
  
  async post(url: string, data?: object, config?: object) {
    try {
      return await api.post(url, data, { timeout: 90000, ...config });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        console.log('🕒 Request timed out, server might be starting...');
        throw new Error('Server is starting up, please wait a moment and try again');
      }
      throw error;
    }
  }
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

// Request interceptor - Add Authorization header for authentication
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error)
  }
)

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {


    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Check if it's a 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh on login page or if we've exceeded max attempts
      if (typeof window !== 'undefined' && (window.location.pathname === '/login' || refreshAttempts >= MAX_REFRESH_ATTEMPTS)) {
        // Reset refresh attempts and redirect to login
        refreshAttempts = 0
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          // Retry the original request after token refresh
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }

      // Check cooldown period to avoid rapid successive calls
      const now = Date.now()
      if (now - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {

        return Promise.reject(error)
      }

      originalRequest._retry = true
      isRefreshing = true
      refreshAttempts++
      lastRefreshAttempt = now

      try {
        // Get refresh token from localStorage
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Send refresh token in request body (backend checks both header and body)
        const response = await api.post('/api/users/refresh-token', { refreshToken }, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });

        if (response.status === 200 && response.data.data?.accessToken) {
          // Store new tokens
          localStorage.setItem('accessToken', response.data.data.accessToken);
          if (response.data.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
          }

          refreshAttempts = 0 // Reset attempts on success
          processQueue(null, response.data.data.accessToken)

          // Retry the original request with new token
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        processQueue(refreshError, null)

        // Handle different error scenarios
        const refreshErrorStatus = (refreshError as AxiosError)?.response?.status
        const isRateLimited = refreshErrorStatus === 429
        const isUnauthorized = refreshErrorStatus === 401 || refreshErrorStatus === 403
        const isConnectionError = (refreshError as AxiosError)?.code === 'ECONNREFUSED' || !refreshErrorStatus

        // If rate limited, unauthorized, connection error, or max attempts reached
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS || isRateLimited || isUnauthorized || isConnectionError) {

          refreshAttempts = 0
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            // Clear any stored user data and tokens
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            sessionStorage.clear()

            // Redirect to login page with appropriate message
            const errorParam = isRateLimited ? '&error=rate_limit' : isConnectionError ? '&error=connection' : ''
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname) + errorParam
          }
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // For other errors, just reject
    return Promise.reject(error)
  }
)

export default api