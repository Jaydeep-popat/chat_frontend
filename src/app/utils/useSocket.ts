// Custom hook for managing socket connection and events
import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, getSocket, disconnectSocket, getTokenFromCookie } from './socket';
import { SocketEvents, Message } from '@/app/types';

export const useSocket = (currentUserId: string | null, events: SocketEvents = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);

  // Connect to socket when user ID is available (only once)
  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ Socket connection skipped - no currentUserId');
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      console.log('⚠️ Socket connection skipped - no token');
      return;
    }

    // Prevent multiple connections for the same user
    if (socketRef.current?.connected) {
      console.log('🔄 Socket already connected, skipping reconnection');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', currentUserId);
    console.log('🍪 Token available:', !!token);
    
    // Create or get existing socket
    if (!socketRef.current) {
      console.log('🆕 Creating new socket instance');
      connectSocket();
      socketRef.current = getSocket();
    } else {
      console.log('🔄 Using existing socket instance:', {
        socketId: socketRef.current.id,
        connected: socketRef.current.connected
      });
    }

    if (!socketRef.current) {
      console.error('❌ Failed to get socket instance');
      return;
    }

    console.log('✅ Socket ready for event registration:', {
      socketId: socketRef.current.id,
      connected: socketRef.current.connected
    });

    // Connection event handlers
    const  handleConnect = () => {
      console.log('🎉 SOCKET CONNECTED SUCCESSFULLY!', {
        socketId: socketRef.current?.id,
        userId: currentUserId,
        timestamp: new Date().toISOString(),
        connected: socketRef.current?.connected
      });
      setIsConnected(true);
      isConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      console.log('❌ SOCKET DISCONNECTED!', {
        socketId: socketRef.current?.id,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      });
      setIsConnected(false);
      isConnectedRef.current = false;
    };

    const handleConnectError = (error: Error) => {
      console.error('❌ Socket connection error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        type: error.name,
        userId: currentUserId,
        hasToken: !!token
      });
      setIsConnected(false);
      isConnectedRef.current = false;
    };

    const handleConnectionConfirmed = (data: { userId: string; status: string; message: string }) => {
      console.log('✅ SERVER CONNECTION CONFIRMED!', {
        serverData: data,
        clientSocketId: socketRef.current?.id,
        clientConnected: socketRef.current?.connected,
        isConnectedState: isConnectedRef.current
      });
      events.onConnectionConfirmed?.(data);
    };

    // Message event handlers
    const handleReceiveMessage = (message: unknown) => {
      const msg = message as Message;
      console.log('🎉 MESSAGE RECEIVED VIA SOCKET!', {
        messageId: msg._id,
        from: (typeof msg.sender === 'object' ? msg.sender?.username : msg.sender) || 'Unknown sender',
        content: msg.content?.substring(0, 50) || 'No content',
        timestamp: new Date().toISOString(),
        socketConnected: !!socketRef.current?.connected,
        eventHandlerExists: !!events.onMessageReceived
      });
      events.onMessageReceived?.(message as never);
    };

    const handleMessageRead = ({ messageId, reader }: { messageId: string; reader: string }) => {
      console.log('👁️ Message read:', { messageId, reader });
      events.onMessageRead?.(messageId, reader);
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      console.log('🗑️ Message deleted:', messageId);
      events.onMessageDeleted?.(messageId);
    };

    const handleMessageEdited = (updatedMessage: unknown) => {
      console.log('✏️ Message edited:', updatedMessage);
      events.onMessageEdited?.(updatedMessage as never);
    };

    // User status event handlers
    const handleUserOnline = ({ userId }: { userId: string }) => {
      console.log('🟢 User online:', userId);
      events.onUserOnline?.(userId);
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      console.log('🔴 User offline:', userId);
      events.onUserOffline?.(userId);
    };

    // Typing event handlers
    const handleUserTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      console.log(`⌨️ User ${isTyping ? 'started' : 'stopped'} typing:`, userId);
      if (isTyping) {
        events.onTypingStart?.(userId);
      } else {
        events.onTypingStop?.(userId);
      }
    };

    // Register all event listeners - use non-null assertion since we check for existence
    if (socketRef.current) {
      socketRef.current!.on('connect', handleConnect);
      socketRef.current!.on('disconnect', handleDisconnect);
      socketRef.current!.on('connect_error', handleConnectError);
      socketRef.current!.on('connection-confirmed', handleConnectionConfirmed);
      socketRef.current!.on('receive-message', handleReceiveMessage);
      socketRef.current!.on('receive-private-message', handleReceiveMessage);
      socketRef.current!.on('message-read', handleMessageRead);
      socketRef.current!.on('message-deleted', handleMessageDeleted);
      socketRef.current!.on('message-edited', handleMessageEdited);
      socketRef.current!.on('user-online', handleUserOnline);
      socketRef.current!.on('user-offline', handleUserOffline);
      socketRef.current!.on('user-typing', handleUserTyping);
      
      // IMPORTANT: Check if socket is already connected and sync state
      console.log('🔍 Checking socket connection status after registering listeners:', {
        socketConnected: socketRef.current!.connected,
        socketId: socketRef.current!.id,
        currentReactState: isConnectedRef.current
      });
      
      if (socketRef.current!.connected) {
        console.log('🔄 Socket already connected, triggering handleConnect manually');
        handleConnect();
      } else {
        console.log('⏳ Socket not yet connected, waiting for connect event');
      }
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current!.off('connect', handleConnect);
        socketRef.current!.off('disconnect', handleDisconnect);
        socketRef.current!.off('connect_error', handleConnectError);
        socketRef.current!.off('connection-confirmed', handleConnectionConfirmed);
        socketRef.current!.off('receive-message', handleReceiveMessage);
        socketRef.current!.off('receive-private-message', handleReceiveMessage);
        socketRef.current!.off('message-read', handleMessageRead);
        socketRef.current!.off('message-deleted', handleMessageDeleted);
        socketRef.current!.off('message-edited', handleMessageEdited);
        socketRef.current!.off('user-online', handleUserOnline);
        socketRef.current!.off('user-offline', handleUserOffline);
        socketRef.current!.off('user-typing', handleUserTyping);
      }
      
      disconnectSocket();
      setIsConnected(false);
      isConnectedRef.current = false;
    };
  }, [currentUserId, events]); // Dependencies for useEffect

  // Add a timer to continuously sync socket state (fallback for state mismatch)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (socketRef.current) {
        const actualConnected = socketRef.current.connected;
        if (actualConnected !== isConnectedRef.current) {
          console.log('⏰ Timer-based state sync triggered!', {
            actualConnected,
            reactState: isConnectedRef.current,
            socketId: socketRef.current.id
          });
          setIsConnected(actualConnected);
          isConnectedRef.current = actualConnected;
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(syncInterval);
  }, []);

  // Socket utility functions
  const joinConversation = useCallback((targetUserId: string) => {
    if (!socketRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Socket not connected, cannot join conversation');
      return;
    }

    console.log('🏠 Joining conversation with user:', targetUserId);
    socketRef.current.emit('join-conversation', { targetUserId });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (!socketRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Socket not connected, cannot join room');
      return;
    }

    console.log('🏠 Joining room:', roomId);
    socketRef.current.emit('join-group', { roomId });
  }, []);

  const sendPrivateMessage = useCallback((targetUserId: string, content: string, messageType: string = 'text') => {
    if (!socketRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return;
    }

    console.log('📤 Sending private message:', { targetUserId, content, messageType });
    socketRef.current.emit('send-private-message', { 
      targetUserId, 
      content, 
      messageType 
    });
  }, []);

  const startTyping = useCallback((targetUserId?: string, roomId?: string) => {
    if (!socketRef.current || !isConnectedRef.current) return;

    socketRef.current.emit('typing-start', { targetUserId, roomId });
  }, []);

  const stopTyping = useCallback((targetUserId?: string, roomId?: string) => {
    if (!socketRef.current || !isConnectedRef.current) return;

    socketRef.current.emit('typing-stop', { targetUserId, roomId });
  }, []);

  // Debug socket connection status and force sync
  useEffect(() => {
    console.log('🔌 Socket Status Update:', { 
      isConnected, 
      currentUserId,
      socketExists: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      socketId: socketRef.current?.id
    });
    
    // Force sync React state with actual socket state
    if (socketRef.current) {
      const actuallyConnected = socketRef.current.connected;
      if (actuallyConnected !== isConnectedRef.current) {
        console.log('🚨 FORCING STATE SYNC!', {
          actuallyConnected,
          reactState: isConnectedRef.current,
          action: 'updating React state to match socket'
        });
        setIsConnected(actuallyConnected);
        isConnectedRef.current = actuallyConnected;
      }
    }
  }, [isConnected, currentUserId]);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    joinRoom,
    sendPrivateMessage,
    startTyping,
    stopTyping
  };
};