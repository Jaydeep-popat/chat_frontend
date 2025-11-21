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

  socket = io("http://localhost:8000", {
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
    // Connection established
  });

  socket.on("disconnect", () => {
    // Socket disconnected
  });

  socket.on("connect_error", () => {
    // Connection error
  });

  socket.on("connection-confirmed", () => {
    // Connection confirmed by server
  });

  socket.on("error", () => {
    // Socket error
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
