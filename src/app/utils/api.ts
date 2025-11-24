import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '', // Use relative path to leverage Next.js rewrites
  withCredentials: true,
  timeout: 10000,
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
  console.log('🧪 Testing API Connection...');
  console.log('🔧 Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL
  });

  try {
    // Test health endpoint
    const response = await api.get('/health');
    console.log('✅ Health check successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Health check failed:', error);
    return { success: false, error };
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

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log all outgoing requests
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    return config
  },
  (error) => {
    console.log('❌ Request Interceptor Error:', error);
    return Promise.reject(error)
  }
)

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response
  },
  async (error: AxiosError) => {
    // Log all API errors with detailed information
    console.log('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      message: error.message,
      code: error.code,
      responseData: error.response?.data,
      requestHeaders: error.config?.headers
    });

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
        console.log('🕒 Refresh attempt too soon, waiting...')
        return Promise.reject(error)
      }

      originalRequest._retry = true
      isRefreshing = true
      refreshAttempts++
      lastRefreshAttempt = now

      try {
        // Try to refresh the token
        console.log(`🔄 Attempting to refresh access token... (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`)

        const refreshBaseURL = ''; // Use relative path for refresh token as well
        const response = await axios.post('/api/users/refresh-token', {}, {
          withCredentials: true,
          baseURL: refreshBaseURL,
          timeout: 10000, // 10 second timeout for refresh requests
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })

        if (response.status === 200) {
          console.log('✅ Token refreshed successfully')
          refreshAttempts = 0 // Reset attempts on success
          processQueue(null, response.data.data.accessToken)

          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.log(`❌ Token refresh failed (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS}):`, refreshError)
        processQueue(refreshError, null)

        // Handle different error scenarios
        const refreshErrorStatus = (refreshError as AxiosError)?.response?.status
        const isRateLimited = refreshErrorStatus === 429
        const isUnauthorized = refreshErrorStatus === 401 || refreshErrorStatus === 403
        const isConnectionError = (refreshError as AxiosError)?.code === 'ECONNREFUSED' || !refreshErrorStatus

        // If rate limited, unauthorized, connection error, or max attempts reached
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS || isRateLimited || isUnauthorized || isConnectionError) {
          console.log(`🚫 Redirecting to login: attempts=${refreshAttempts}, rateLimited=${isRateLimited}, unauthorized=${isUnauthorized}, connectionError=${isConnectionError}`)
          refreshAttempts = 0
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            // Clear any stored user data
            localStorage.removeItem('user')
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