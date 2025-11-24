// utils/socket.ts
import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;
export const getTokenFromCookie = (): string | null => {
  // Try multiple cookie name variations
  const accessTokenMatch = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  const tokenMatch = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);

  const token = accessTokenMatch?.[1] || tokenMatch?.[1] || null;



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

  const token = getTokenFromCookie();
  const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://chat-backend-5wt4.onrender.com';



  socket = io(socketURL, {
    withCredentials: true, // Enable cookies
    transports: ["websocket", "polling"], // Allow polling fallback
    forceNew: false, // Don't force new connection
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 10000,
    extraHeaders: {
      // Send token in headers as backup
      "Authorization": `Bearer ${token || ""}`,
    },
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
