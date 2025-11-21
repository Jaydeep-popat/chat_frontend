"use client";
import Link from "next/link";
import {
  MessageCircle,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/app/components/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 scroll-smooth">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md backdrop-blur bg-opacity-90">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900 tracking-tight">
              ChatFlow
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-base px-4 py-2 hover:bg-blue-600 hover:text-white transition rounded-md"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="default"
                className="text-base px-5 py-2 hover:bg-blue-600 hover:text-white transition rounded-md"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Icon + Sparkles */}
          <div className="flex justify-center mb-6 relative">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl relative shadow-lg">
              <MessageCircle className="h-12 w-12 text-white" />
              <Sparkles className="absolute -top-3 -right-3 h-6 w-6 text-yellow-500 animate-bounce" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Connect, Chat, and{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Collaborate
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Seamlessly chat with friends, family, and colleagues in real-time
            using our beautiful, modern platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Register Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent hover:bg-blue-50 transition"
              >
                Login to Continue
              </Button>
            </Link>
          </div>

          {/* Hero Preview */}
          <div className="relative max-w-3xl mx-auto mb-20">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chat Interface Preview</p>
                </div>
              </div>
            </div>
            {/* Floating Icons */}
            <div className="absolute -top-4 -left-4 bg-green-500 text-white p-3 rounded-full shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div className="absolute -top-4 -right-4 bg-purple-500 text-white p-3 rounded-full shadow-md">
              <Zap className="h-6 w-6" />
            </div>
          </div>

          {/* Features Section */}
          <section className="grid md:grid-cols-3 gap-10  max-w-6xl mx-auto mb-24 ">
            {[
              {
                icon: <MessageCircle className="h-8 w-8 text-blue-600" />,
                title: "Real-time Messaging",
                desc: "Send and receive messages instantly with our lightning-fast system.",
                bg: "bg-blue-100",
              },
              {
                icon: <Users className="h-8 w-8 text-purple-600" />,
                title: "Group Chats",
                desc: "Create group conversations and collaborate seamlessly.",
                bg: "bg-purple-100",
              },
              {
                icon: <Shield className="h-8 w-8 text-green-600" />,
                title: "Secure & Private",
                desc: "End-to-end encrypted chats with full privacy control.",
                bg: "bg-green-100",
              },
            ].map(({ icon, title, desc, bg }, index) => (
              <div
                key={index}
                className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 ease-in-out"
              >
                <div
                  className={`${bg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  {icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  {title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </section>

          {/* Bottom CTA */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands already using ChatFlow daily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black border-gray-300 hover:bg-blue-600 hover:text-white hover:shadow-xl hover:scale-[1.03] transition-all duration-300 ease-in-out"
                >
                  Register
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black border-gray-300 hover:bg-purple-600 hover:text-white hover:shadow-xl hover:scale-[1.03] transition-all duration-300 ease-in-out"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-8">
            Welcome to ChatFlow
          </h2>
          <p className="text-lg text-center text-gray-600 mb-8">
            Your modern chat experience starts here.
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Login
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Terms & Conditions
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-7 px-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="bg-blue-600 p-1.5 rounded">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <span className="font-semibold text-lg">ChatFlow</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            © 2024 ChatFlow. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/terms" className="hover:text-gray-900 transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-gray-900 transition">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
