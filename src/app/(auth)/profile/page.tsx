"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/api";
import Link from "next/link";
import { Loader2, Camera, User as UserIcon, LogOut, Users, Upload, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar";
import { User } from "@/app/types";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user, logout: authLogout, updateUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    setLoading(false);
    
    // If not loading and no user is authenticated, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Logout user using AuthContext
  const handleLogout = async () => {
    try {
      await authLogout();
      router.push("/login");
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      router.push("/login");
    }
  };

  // Fetch all users
  const getAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/api/users/getAlluser");
      setAllUsers(res.data.data);
    } catch {
      // Error fetching all users
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle profile picture change
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await api.post(
        "/api/users/updateProfilePicture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      updateUser({
        profilePic: res.data.data.profilePic,
      });
      alert("Profile picture updated!");
    } catch {
      alert("Failed to update profile picture.");
      // Error updating profile picture
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
        {/* Header with Navigation */}
        <div className="text-center relative">
          <div className="absolute top-0 left-0 sm:hidden">
            <Link
              href="/chat-page"
              className="p-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              ← Back
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Profile Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your account and connect with others
          </p>
          <div className="hidden sm:block absolute top-0 right-0">
            <div className="flex gap-4">
              <Link
                href="/chat-page"
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Back to Chat
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Current User Profile Card */}
        {user ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={user.profilePic && user.profilePic !== "" ? user.profilePic : undefined} 
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl font-bold">
                      {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={triggerFileInput}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user.displayName || user.username}
                  </h2>
                  <p className="text-indigo-100 mb-1">@{user.username}</p>
                  <p className="text-indigo-100">{user.email}</p>
                  <div className="flex items-center justify-center sm:justify-start mt-3">
                    <div
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isOnline
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          user.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></div>
                      {user.isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 text-indigo-600 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg font-bold">📅</span>
                  </div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 text-indigo-600 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg font-bold">⚡</span>
                  </div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">Active</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <UserIcon className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-600">No user data available</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-lg"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>

          <button
            onClick={getAllUsers}
            disabled={loadingUsers}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-lg disabled:opacity-50"
          >
            {loadingUsers ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Users className="h-5 w-5 mr-2" />
            )}
            {loadingUsers ? "Loading..." : "Get All Users"}
          </button>

          <Link
            href="/updateAccount"
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Update Account
          </Link>

          <Link
            href="/change-password"
            className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium shadow-lg"
          >
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </Link>

          {/* ✅ New Chat Page Button */}
          <Link
            href="/chat-page"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-lg"
          >
            <span className="material-icons mr-2">💬</span>
            Go to Chat
          </Link>
        </div>

        {/* All Users Section */}
        {allUsers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-indigo-600" />
                All Users ({allUsers.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsers.map((userData) => (
                  <div
                    key={userData._id}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 border border-gray-200"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200">
                        <AvatarImage 
                          src={userData.profilePic && userData.profilePic !== "" ? userData.profilePic : undefined} 
                          alt={userData.displayName || userData.username}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold">
                          {(userData.displayName || userData.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {userData.displayName || userData.username}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          @{userData.username}
                        </p>
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            userData.isOnline
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              userData.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                          {userData.isOnline ? "Online" : "Offline"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span>{" "}
                        {userData.email}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Role:</span>
                        <span className="capitalize ml-1">{userData.role}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Logout Button */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
export default Profile;
