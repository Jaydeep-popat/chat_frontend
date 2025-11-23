// Custom hook for managing socket connection and events
import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, getSocket, disconnectSocket, getTokenFromCookie } from './socket';
import { SocketEvents } from '@/app/types';

export const useSocket = (currentUserId: string | null, events: SocketEvents = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);
  const eventsRef = useRef(events);
  
  // Always keep the latest events
  eventsRef.current = events;

  // Connect to socket when user ID is available (only once)
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      return;
    }

    // Prevent multiple connections for the same user
    if (socketRef.current?.connected) {
      return;
    }

    // Create or get existing socket
    if (!socketRef.current) {
      connectSocket();
      socketRef.current = getSocket();
    }

    if (!socketRef.current) {
      return;
    }

    // Connection event handlers
    const handleConnect = () => {
      setIsConnected(true);
      isConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      isConnectedRef.current = false;
    };

    const handleConnectError = () => {
      setIsConnected(false);
      isConnectedRef.current = false;
    };

    const handleConnectionConfirmed = (data: { userId: string; status: string; message: string }) => {
      eventsRef.current.onConnectionConfirmed?.(data);
    };

    // Message event handlers
    const handleReceiveMessage = (message: unknown) => {
      eventsRef.current.onMessageReceived?.(message as never);
    };

    const handleMessageRead = ({ messageId, reader }: { messageId: string; reader: string }) => {
      eventsRef.current.onMessageRead?.(messageId, reader);
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      eventsRef.current.onMessageDeleted?.(messageId);
    };

    const handleMessageEdited = (updatedMessage: unknown) => {
      eventsRef.current.onMessageEdited?.(updatedMessage as never);
    };

    // User status event handlers
    const handleUserOnline = ({ userId }: { userId: string }) => {
      eventsRef.current.onUserOnline?.(userId);
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      eventsRef.current.onUserOffline?.(userId);
    };

    // Typing event handlers
    const handleUserTyping = ({ userId, isTyping, roomId }: { userId: string; isTyping: boolean; roomId?: string }) => {
      if (isTyping) {
        eventsRef.current.onTypingStart?.(userId, roomId);
      } else {
        eventsRef.current.onTypingStop?.(userId, roomId);
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

      // Group Events
      socketRef.current!.on('group-chat-created', (room) => eventsRef.current.onGroupChatCreated?.(room));
      socketRef.current!.on('added-to-group', (room) => eventsRef.current.onAddedToGroup?.(room));
      socketRef.current!.on('participant-added', (data) => eventsRef.current.onParticipantAdded?.(data));
      socketRef.current!.on('participant-removed', (data) => eventsRef.current.onParticipantRemoved?.(data));
      socketRef.current!.on('group-updated', (room) => eventsRef.current.onGroupUpdated?.(room));
      socketRef.current!.on('participant-left', (data) => eventsRef.current.onParticipantLeft?.(data));

      // IMPORTANT: Check if socket is already connected and sync state
      if (socketRef.current!.connected) {
        handleConnect();
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
  }, [currentUserId]); // Dependencies for useEffect - events removed to prevent infinite re-renders

  // Add a timer to continuously sync socket state (fallback for state mismatch)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (socketRef.current) {
        const actualConnected = socketRef.current.connected;
        if (actualConnected !== isConnectedRef.current) {
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
      return;
    }

    socketRef.current.emit('join-conversation', { targetUserId });
  }, []);

  const joinGroup = useCallback((roomId: string) => {
    if (!socketRef.current || !isConnectedRef.current) {
      return;
    }

    socketRef.current.emit('join-group', { roomId });
  }, []);

  const sendPrivateMessage = useCallback((targetUserId: string, content: string, messageType: string = 'text') => {
    if (!socketRef.current || !isConnectedRef.current) {
      return;
    }

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

  // Force sync React state with actual socket state
  useEffect(() => {
    if (socketRef.current) {
      const actuallyConnected = socketRef.current.connected;
      if (actuallyConnected !== isConnectedRef.current) {
        setIsConnected(actuallyConnected);
        isConnectedRef.current = actuallyConnected;
      }
    }
  }, [isConnected, currentUserId]);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    joinGroup,
    sendPrivateMessage,
    startTyping,
    stopTyping
  };
};