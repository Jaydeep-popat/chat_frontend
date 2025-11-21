// utils/socket.ts
import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;
export const getTokenFromCookie = (): string | null => {
  console.log('🍪 All cookies:', document.cookie);
  
  // Try multiple cookie name variations
  const accessTokenMatch = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  const tokenMatch = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  
  const token = accessTokenMatch?.[1] || tokenMatch?.[1] || null;
  
  console.log('🔍 Cookie parsing results:', {
    accessTokenMatch: !!accessTokenMatch,
    tokenMatch: !!tokenMatch,
    foundToken: !!token,
    tokenLength: token?.length || 0
  });
  
  return token;
};
export const connectSocket = () => { 
  // Return existing socket if connected
  if (socket?.connected) {
    console.log('🔄 Returning existing connected socket:', socket.id);
    return socket;
  }
  
  // Don't create new socket if one exists (even if disconnected)
  if (socket) {
    console.log('🔄 Socket exists but disconnected, attempting reconnection');
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }
    
  const token = getTokenFromCookie();
  console.log("🔌 INITIALIZING NEW SOCKET CONNECTION:", { 
    hasToken: !!token, 
    tokenLength: token?.length || 0,
    serverUrl: "http://localhost:8000"
  });

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
    console.log("✅ Connected to Socket.IO:", {
      socketId: socket?.id,
      transport: socket?.io.engine.transport.name,
      connected: socket?.connected
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from Socket.IO:", {
      reason,
      socketId: socket?.id
    });
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connect error:", {
      message: err.message
    });
  });

  socket.on("connection-confirmed", (data) => {
    console.log("✅ Connection confirmed from server:", data);
  });

  socket.on("error", (error) => {
    console.error("❌ Socket error event:", error);
  });

  return socket;
};


// ✅ Return the current socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// ✅ Clean up the socket connection
export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket:', socket.id);
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
