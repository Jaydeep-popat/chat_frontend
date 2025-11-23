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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900 scroll-smooth">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-xl border-b border-purple-200/30">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              MeanMessenger
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-base px-4 py-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 rounded-xl transform hover:scale-105"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="default"
                className="text-base px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 rounded-xl shadow-lg transform hover:scale-105"
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
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 rounded-3xl relative shadow-2xl animate-pulse">
              <MessageCircle className="h-16 w-16 text-white" />
              <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-yellow-400 animate-bounce" />
              <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-pink-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-tight tracking-tight">
            Connect, Chat, and{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Collaborate
            </span>
            <span className="block text-4xl md:text-5xl mt-2 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">✨ Like Never Before ✨</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Seamlessly chat with friends, family, and colleagues in real-time
            using our beautiful, modern platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl transform transition-all duration-300 hover:scale-110 rounded-2xl px-8 py-4 text-lg font-bold">
                🚀 Register Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-2 border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-4 text-lg font-semibold"
              >
                💫 Login to Continue
              </Button>
            </Link>
          </div>

          {/* Hero Preview */}
          <div className="relative max-w-4xl mx-auto mb-20">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-purple-200/50">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-80 flex items-center justify-center border border-purple-200/30">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl mx-auto mb-6 w-fit shadow-xl">
                    <MessageCircle className="h-20 w-20 text-white" />
                  </div>
                  <p className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✨ Chat Interface Preview ✨</p>
                  <p className="text-gray-600 mt-2">Experience seamless messaging</p>
                </div>
              </div>
            </div>
            {/* Floating Icons */}
            <div className="absolute -top-6 -left-6 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 rounded-full shadow-xl animate-bounce">
              <Users className="h-8 w-8" />
            </div>
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-full shadow-xl animate-bounce" style={{ animationDelay: '0.5s' }}>
              <Zap className="h-8 w-8" />
            </div>
            <div className="absolute -bottom-6 right-1/3 bg-gradient-to-r from-pink-400 to-rose-500 text-white p-3 rounded-full shadow-xl animate-bounce" style={{ animationDelay: '1s' }}>
              <Shield className="h-6 w-6" />
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
                className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-200/50 shadow-xl hover:shadow-2xl hover:scale-[1.08] transition-all duration-500 ease-in-out transform hover:-translate-y-2"
              >
                <div
                  className={`${bg} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse`}
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
          <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-3xl p-16 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <h2 className="text-4xl font-extrabold mb-6">✨ Ready to get started? ✨</h2>
            <p className="text-xl mb-10 opacity-90">
              🚀 Join thousands already using MeanMessenger daily!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto bg-white/90 backdrop-blur-sm text-purple-700 font-bold border-none hover:bg-white hover:shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out rounded-2xl px-8 py-4 text-lg"
                >
                  🎉 Register Now
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white font-bold border-2 border-white/50 hover:bg-white/30 hover:border-white hover:shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out rounded-2xl px-8 py-4 text-lg"
                >
                  ✨ Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-purple-200/50 shadow-xl">
            <h2 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              👋 Welcome to MeanMessenger
            </h2>
            <p className="text-xl text-center text-gray-600 mb-12">
              ✨ Your modern chat experience starts here. ✨
            </p>
            <div className="flex gap-6 justify-center mb-8">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold text-lg"
              >
                🎆 Sign Up
              </Link>
              <Link
                href="/login"
                className="bg-white/80 backdrop-blur-sm text-purple-700 px-8 py-4 rounded-2xl hover:bg-white border-2 border-purple-300 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
              >
                🔑 Login
              </Link>
            </div>
            <div className="text-center">
              <Link
                href="/terms"
                className="text-purple-600 hover:text-purple-800 underline font-semibold"
              >
                📜 Terms & Conditions
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm py-10 px-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MeanMessenger</span>
          </div>
          <p className="text-center text-sm text-gray-600 font-medium">
            © 2025 MeanMessenger. All rights reserved. ✨
          </p>
          <div className="flex items-center space-x-8 text-sm text-gray-700 font-semibold">
            <Link href="/terms" className="hover:text-purple-600 transition-colors duration-200">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-pink-600 transition-colors duration-200">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
