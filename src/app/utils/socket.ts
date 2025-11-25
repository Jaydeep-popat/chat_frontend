// utils/socket.ts
import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;
export const getTokenFromStorage = (): string | null => {
  // Get token from localStorage (Authorization header approach)
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('accessToken');
  return token;
};
export const connectSocket = () => {
  // Return existing socket if connected
  if (socket?.connected) {
    return socket;
  }

  // Don't create new socket if one exists (even if disconnected)
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const token = getTokenFromStorage();
  const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';



  socket = io(socketURL, {
    withCredentials: true, // Enable cookies for backward compatibility
    transports: ["websocket", "polling"], // Allow polling fallback
    forceNew: false, // Don't force new connection
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 10000,
    extraHeaders: {
      // Send token in Authorization header (primary method)
      "Authorization": token ? `Bearer ${token}` : "",
    },
    // Also send as query parameter as fallback
    query: {
      token: token || ""
    }
  });

  socket.on("connect", () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on("connect_error", (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on("connection-confirmed", () => {
    console.log('Socket connection confirmed');
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};


// ✅ Return the current socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Clean up the socket connection
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
