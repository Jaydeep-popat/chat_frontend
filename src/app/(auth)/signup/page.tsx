"use client"
import { useState } from "react"
import type React from "react"
import axios, { isAxiosError, type AxiosError } from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Upload, Loader2, Camera } from "lucide-react"

function Signup() {
  const [user, setUser] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    role: "user",
  })

  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser({ ...user, [name]: value })
    if (error) setError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfilePic(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (user.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(user.password)) {
      setError("Password must contain at least one number and one special character")
      setLoading(false)
      return
    }

    const formData = new FormData()
    Object.entries(user).forEach(([key, value]) => formData.append(key, value))
    if (profilePic) formData.append("profilePic", profilePic)

    try {
      await axios.post("/api/users/register", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      })
      
      // Show success message and redirect
      alert("Account created successfully! Please log in.")
      router.push("/login")
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>
        setError(
          axiosError.response?.data?.message ??
          "Signup failed. Please try again."
        )
      } else {
        setError(
          (error as Error)?.message ||
          "Signup failed. Please try again."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-4 sm:p-8 space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-600">Join our community today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Picture Upload */}
          <div className="col-span-full flex flex-col items-center mt-2 mb-2">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="profilePic"
                className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition"
              >
                <Upload className="h-4 w-4 text-white" />
              </label>
            </div>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-1">Upload profile picture (optional)</p>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="username"
                value={user.username}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Choose a username"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="text-sm font-medium text-gray-700 block mb-1">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="displayName"
                value={user.displayName}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Your display name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={user.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="col-span-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              {["user", "admin"].map((role) => (
                <label key={role}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={user.role === role}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`p-4 rounded-lg border-2 transition-all text-center cursor-pointer ${
                      user.role === role
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 hover:border-gray-400 bg-white text-gray-700"
                    }`}
                  >
                    <p className="font-medium capitalize">{role}</p>
                    <p className="text-xs text-gray-500">
                      {role === "user" ? "Regular account" : "Admin privileges"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="col-span-full bg-red-100 text-red-600 text-sm p-3 rounded-lg border border-red-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="col-span-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Signup
