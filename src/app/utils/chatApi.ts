// Chat API utility functions for messaging
import api from './api';
import {
  Message as ApiMessage,
  ChatConversation,
  MessagesResponse,
  ChatRoom,
  ChatUser
} from '@/app/types';

const API_BASE = '/api/messages';

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  roomId?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string;
  timestamp: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface GetMessagesRequest {
  receiver?: string;
  room?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// Send a text message
export const sendTextMessage = async (targetId: string, content: string, isGroup: boolean = false): Promise<ApiMessage> => {
  try {
    const payload = isGroup
      ? { room: targetId, content, messageType: 'text' }
      : { receiver: targetId, content, messageType: 'text' };

    const response = await api.post(`${API_BASE}/send-message`, payload);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Send a file message (image, video, or document)
export const sendFileMessage = async (
  targetId: string,
  file: File,
  content?: string,
  isGroup: boolean = false
): Promise<ApiMessage> => {
  try {
    const formData = new FormData();
    if (isGroup) {
      formData.append('room', targetId);
    } else {
      formData.append('receiver', targetId);
    }
    formData.append('file', file);

    // Determine message type based on file type
    let messageType: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    }

    formData.append('messageType', messageType);

    if (content) {
      formData.append('content', content);
    }

    const response = await api.post(`${API_BASE}/send-message`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get messages for a conversation
export const getMessages = async (params: GetMessagesRequest): Promise<MessagesResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.receiver) queryParams.append('receiver', params.receiver);
    if (params.room) queryParams.append('room', params.room);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await api.get(`${API_BASE}/get-messages?${queryParams}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get chat list
export const getChatList = async (): Promise<ChatConversation[]> => {
  try {
    const response = await api.get(`${API_BASE}/get-chat-list`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await api.patch(`${API_BASE}/mark-as-read/${messageId}`, {});
  } catch (error) {
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await api.delete(`${API_BASE}/delete-message/${messageId}`);
  } catch (error) {
    throw error;
  }
};

// Edit a message
export const editMessage = async (messageId: string, content: string): Promise<ApiMessage> => {
  try {
    const response = await api.put(`${API_BASE}/edit-message/${messageId}`, {
      content
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get(`${API_BASE}/getUnreadCount`);
    return response.data.data.unreadCount;
  } catch (error) {
    throw error;
  }
};

// --- Group Chat APIs ---

export const createGroupChat = async (
  name: string,
  participants: string[], 
  description?: string,
  groupImage?: File
): Promise<ChatRoom> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('participants', JSON.stringify(participants));
    
    if (description) {
      formData.append('description', description);
    }
    
    if (groupImage) {
      formData.append('groupImage', groupImage);
    }

    const response = await api.post('/api/chat-rooms/create-group', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const addParticipant = async (roomId: string, userId: string): Promise<ChatRoom> => {
  try {
    const response = await api.post(`/api/chat-rooms/${roomId}/add-participant`, {
      userId
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const removeParticipant = async (roomId: string, userId: string): Promise<void> => {
  try {
    await api.post(`/api/chat-rooms/${roomId}/remove-participant`, {
      userId
    });
  } catch (error) {
    throw error;
  }
};

export const leaveGroupChat = async (roomId: string): Promise<void> => {
  try {
    await api.post(`/api/chat-rooms/${roomId}/leave`, {});
  } catch (error) {
    throw error;
  }
};

export const updateGroupChat = async (
  roomId: string, 
  name?: string, 
  description?: string,
  groupImage?: File
): Promise<ChatRoom> => {
  try {
    const formData = new FormData();
    
    if (name) {
      formData.append('name', name);
    }
    
    if (description !== undefined) {
      formData.append('description', description);
    }
    
    if (groupImage) {
      formData.append('groupImage', groupImage);
    }

    const response = await api.put(`/api/chat-rooms/${roomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Update group image specifically
export const updateGroupImage = async (roomId: string, groupImage: File): Promise<ChatRoom> => {
  try {
    const formData = new FormData();
    formData.append('groupImage', groupImage);

    const response = await api.put(`/api/chat-rooms/${roomId}/update-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get chat room details
export const getChatRoomDetails = async (roomId: string): Promise<ChatRoom> => {
  try {
    const response = await api.get(`/api/chat-rooms/${roomId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get user's chat rooms
export const getUserChatRooms = async (page: number = 1, limit: number = 20): Promise<{chatRooms: ChatRoom[], pagination: { totalRooms: number; totalPages: number; currentPage: number; limit: number }}> => {
  try {
    const response = await api.get(`/api/chat-rooms/user-rooms?page=${page}&limit=${limit}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Utility functions for message formatting
export const formatMessage = (msg: ApiMessage, currentUserId: string): Message => {
  const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
  const readByArray = Array.isArray(msg.readBy) ? msg.readBy : [];

  const isReadByUser = readByArray.some((id: string) => {
    return id === currentUserId;
  });

  return {
    id: msg._id,
    senderId,
    receiverId: typeof msg.receiver === 'string' ? msg.receiver : msg.receiver?._id,
    roomId: msg.room,
    content: msg.content || '',
    messageType: msg.messageType || 'text',
    fileUrl: msg.fileUrl,
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    isOwn: senderId === currentUserId,
    isRead: isReadByUser,
    createdAt: msg.createdAt
  };
};

export const formatChatUser = (chat: ChatConversation, currentUserId: string): ChatUser | null => {
  // Handle Group Chat
  if (chat.room) {
    return {
      id: chat.room._id,
      userId: chat.room._id, // Use room ID as userId for consistency in selection logic
      name: chat.room.name,
      avatar: chat.room.groupImage || '', // Use group image or empty
      description: chat.room.description,
      lastMessage: chat.lastMessage?.content || '',
      lastMessageTime: chat.lastMessage?.createdAt
        ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
        : '',
      isOnline: false, // Groups don't have online status
      unreadCount: chat.unreadCount || 0,
      isGroup: true,
      admins: chat.room.admins?.map(u => u._id) || [],
      participants: chat.room.participants?.map(u => u._id) || []
    };
  }

  // Handle DM
  if (!chat.sender || !chat.receiver) return null;

  const otherUser = chat.sender._id === currentUserId ? chat.receiver : chat.sender;
  if (!otherUser) return null;

  return {
    id: chat._id,
    userId: otherUser._id,
    name: otherUser.displayName || otherUser.username || 'Unknown User',
    avatar: otherUser.profilePic || '',
    lastMessage: chat.lastMessage?.content || '',
    lastMessageTime: chat.lastMessage?.createdAt
      ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
      : '',
    isOnline: otherUser.isOnline || false,
    unreadCount: chat.unreadCount || 0,
    isGroup: false
  };
};