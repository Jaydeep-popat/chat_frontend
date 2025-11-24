// utils/socket.ts
import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;
export const getTokenFromCookie = (): string | null => {
  // Try multiple cookie name variations
  const accessTokenMatch = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  const tokenMatch = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);

  const token = accessTokenMatch?.[1] || tokenMatch?.[1] || null;

  console.log('🍪 Socket: Cookie check:', {
    fullCookie: document.cookie,
    accessTokenFound: !!accessTokenMatch,
    tokenFound: !!tokenMatch,
    finalToken: token ? `${token.substring(0, 20)}...` : 'none'
  });

  return token;
};
export const connectSocket = () => {
  // Return existing socket if connected
  if (socket?.connected) {
    console.log('🔌 Socket already connected, returning existing socket');
    return socket;
  }

  // Don't create new socket if one exists (even if disconnected)
  if (socket) {
    if (!socket.connected) {
      console.log('🔄 Reconnecting existing socket');
      socket.connect();
    }
    return socket;
  }

  const token = getTokenFromCookie();
  const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://chat-backend-5wt4.onrender.com';

  console.log('🚀 Creating new socket connection:', {
    url: socketURL,
    hasToken: !!token,
    token: token ? `${token.substring(0, 20)}...` : 'none'
  });

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
    console.log('✅ Socket connected successfully:', socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on("connect_error", (error) => {
    console.log('❌ Socket connection error:', error);
  });

  socket.on("connection-confirmed", (data) => {
    console.log('✅ Socket connection confirmed by server:', data);
  });

  socket.on("error", (error) => {
    console.log('❌ Socket error:', error);
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
