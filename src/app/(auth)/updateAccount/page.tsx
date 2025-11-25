"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/api";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const UpdateDetailsPage = () => {
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  // Fetch user on load
  useEffect(() => {
    const fetchUser = async () => {
      setFetching(true);
      try {
        const res = await api.get("/api/users/getCurrentUser");
        const user = res.data.data;
        setForm({
          username: user.username || "",
          displayName: user.displayName || "",
          email: user.email || ""
        });
      } catch {
        alert("Failed to fetch user data.");
        // Error fetching user data
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/users/updateAccountDetails", form);
      alert("Profile updated successfully!");
      router.push("/profile");
    } catch {
      alert("Failed to update profile.");
      // Error updating profile
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Update Profile</h2>
          <p className="text-sm text-gray-600">Edit your account information</p>
        </div>

        {fetching ? (
          <div className="text-center text-gray-600">Loading current user data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 text-white font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/profile" className="text-sm text-indigo-600 hover:underline">
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpdateDetailsPage;
