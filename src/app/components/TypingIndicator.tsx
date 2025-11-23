"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar"

interface TypingIndicatorProps {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-start gap-2 px-4 py-1.5 opacity-0 animate-fadeInUp">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-6 w-6">
          <AvatarImage src={users[0]?.avatar} />
          <AvatarFallback className="text-xs bg-gray-300">
            {users[0]?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        {users.length > 1 && (
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center font-medium">
            {users.length}
          </div>
        )}
      </div>

      {/* Typing bubble */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm">
        <div className="flex items-center justify-center h-4">
          {/* Animated dots */}
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Show typing text for multiple users */}
        {users.length > 1 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {users.length === 2 
              ? `${users[0]?.name} and ${users[1]?.name} are typing...`
              : `${users.length} people are typing...`
            }
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}