"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { FullPageLoading } from "@/components/LoadingSpinner"
import { Mail, Lock, User, Eye, EyeOff, LogIn, Loader2 } from "lucide-react"

function Login() {
  const [data, setData] = useState({
    usernameOrEmail: "",
    password: "",
  })
  const [isEmail, setIsEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user, login, loading: authLoading } = useAuth()

  // Handle URL parameters and error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const redirect = urlParams.get('redirect') || '/chat-page'
    

    
    // Set appropriate error message based on URL parameter
    if (errorParam === 'rate_limit') {
      setError('Too many login attempts. Please try again in a few minutes.')
    } else if (errorParam === 'connection') {
      setError('Connection error. Please check your internet connection and try again.')
    } else if (errorParam === 'token_expired') {
      setError('Your session has expired. Please log in again.')
    }

    // Redirect if user is already logged in
    if (user) {
      router.replace(redirect)
    }
  }, [user, router])

  // Show loading spinner while checking authentication
  if (authLoading) {
    return <FullPageLoading text="Checking authentication..." />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'usernameOrEmail') {
      // Detect if input is email format
      setIsEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    }
    
    setData({ ...data, [name]: value })
    if (error) setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const onLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    // Prepare login data based on input type
    const loginData = isEmail 
      ? { email: data.usernameOrEmail, password: data.password }
      : { username: data.usernameOrEmail, password: data.password }
    
    try {
      await login(loginData)
      
      // Force redirect after successful login
      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get('redirect') || '/chat-page'
      
      // Small delay to ensure user state is updated
      setTimeout(() => {
        router.push(redirect);
      }, 100);
      
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const apiError = error as { 
        response?: { data?: { message?: string } }; 
        message?: string;
        code?: string;
      };
      
      // Handle cold start and timeout errors with better messaging
      if (apiError.message?.includes('Server is starting up') || 
          apiError.message?.includes('timeout') ||
          apiError.code === 'ECONNABORTED') {
        setError("🌅 Server is waking up from sleep (this takes 30-60 seconds on free hosting). Please wait and try again.");
      } else if (apiError.message?.includes('Network Error') || apiError.message?.includes('Connection failed')) {
        setError("🔌 Connection failed. Server might be starting up, please try again in a moment.");
      } else {
        setError(apiError.response?.data?.message || apiError.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full scale-105 sm:scale-100 md:scale-105">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-gray-600 text-base">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Username or Email */}
              <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isEmail ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    name="usernameOrEmail"
                    id="usernameOrEmail"
                    value={data.usernameOrEmail}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder={isEmail ? "Enter your email" : "Enter your username or email"}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isEmail ? "Email detected" : "You can use username or email"}
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={data.password}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-12 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                onClick={onLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 sm:px-10 bg-gray-50 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                <Link
                  href="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
