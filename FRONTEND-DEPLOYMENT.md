# 🌐 Frontend Configuration for Vercel Deployment

## 📁 Create `next.config.js` in Frontend Root

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-app.vercel.app'
      : 'http://localhost:8000',
    SOCKET_URL: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-app.vercel.app'
      : 'http://localhost:8000'
  },

  // Image optimization for Cloudinary
  images: {
    domains: [
      'res.cloudinary.com',
      'cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Enable SWC minification
  swcMinify: true,

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },

  // API route rewrites for development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*'
        }
      ];
    }
    return [];
  },

  // Headers for better security and CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 🔧 Update API Configuration

### Create/Update `src/utils/apiConfig.js`:

```javascript
// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-app.vercel.app'
    : 'http://localhost:8000',
  
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-app.vercel.app'
    : 'http://localhost:8000',
    
  TIMEOUT: 10000, // 10 seconds
  
  WITH_CREDENTIALS: true,
};

// Axios instance with proper configuration
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.WITH_CREDENTIALS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        await apiClient.post('/api/users/refresh-token');
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 🔌 Update Socket Configuration

### Update `src/utils/socket.js`:

```javascript
import io from 'socket.io-client';
import { API_CONFIG } from './apiConfig';

let socket = null;

export const getTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return null;
};

export const connectSocket = () => {
  if (socket?.connected) {
    console.log('Socket already connected');
    return socket;
  }

  const token = getTokenFromCookie();
  
  socket = io(API_CONFIG.SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: {
      token: token
    },
    query: {
      token: token
    },
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

## 📦 Package.json Scripts

Add these scripts to your frontend `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "deploy": "vercel --prod",
    "preview": "vercel",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

## 🌍 Environment Variables for Frontend

### Local Development (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### Production (Vercel Dashboard):
```bash
NEXT_PUBLIC_API_URL=https://your-backend-app.vercel.app
NODE_ENV=production
```

## 🚀 Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd FRONTEND
vercel

# For production deployment
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend-app.vercel.app
```

## 🔍 Testing Deployment

### 1. Check API Connection:
```javascript
// Test in browser console
fetch('https://your-backend-app.vercel.app/api/users/getAlluser', {
  credentials: 'include'
}).then(res => res.json()).then(console.log);
```

### 2. Check Socket Connection:
```javascript
// Test in browser console
const socket = io('https://your-backend-app.vercel.app', {
  withCredentials: true
});
socket.on('connect', () => console.log('Connected:', socket.id));
```

### 3. Check CORS:
- Open browser dev tools → Network tab
- Look for CORS-related errors
- Verify cookies are being sent/received

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
```
Access to fetch at 'https://backend.vercel.app' from origin 'https://frontend.vercel.app' 
has been blocked by CORS policy
```

**Solution**: 
- Verify `CORS_ORIGIN` and `FRONTEND_URL` environment variables in backend
- Check that both domains are added to allowed origins

### Issue 2: Cookies Not Working
```
Cookies not being set or sent between domains
```

**Solution**:
- Ensure `sameSite: 'none'` and `secure: true` in production
- Verify `withCredentials: true` in frontend requests

### Issue 3: Socket Connection Failed
```
WebSocket connection to 'wss://backend.vercel.app/socket.io/' failed
```

**Solution**:
- Enable polling fallback: `transports: ['websocket', 'polling']`
- Check Socket.IO CORS configuration
- Verify WebSocket support on hosting platform

### Issue 4: 502 Bad Gateway
```
502 Bad Gateway error on API calls
```

**Solution**:
- Check serverless function timeout limits
- Verify MongoDB connection string
- Check environment variables are set correctly

## 📚 Useful Links

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Socket.IO with Vercel](https://socket.io/docs/v4/deployment/#vercel)