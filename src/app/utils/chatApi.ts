// Chat API utility functions for messaging
import axios from 'axios';
import { 
  Message as ApiMessage, 
  ChatConversation,
  MessagesResponse 
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

export interface ChatUser {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiver: string;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  file?: File;
}

export interface GetMessagesRequest {
  receiver?: string;
  room?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// Send a text message
export const sendTextMessage = async (receiver: string, content: string): Promise<ApiMessage> => {
  try {
    const response = await axios.post(`${API_BASE}/send-message`, {
      receiver,
      content,
      messageType: 'text'
    }, {
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
};

// Send a file message (image, video, or document)
export const sendFileMessage = async (
  receiver: string, 
  file: File, 
  content?: string
): Promise<ApiMessage> => {
  try {
    const formData = new FormData();
    formData.append('receiver', receiver);
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

    const response = await axios.post(`${API_BASE}/send-message`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error sending file message:', error);
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

    const response = await axios.get(`${API_BASE}/get-messages?${queryParams}`, {
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Get chat list
export const getChatList = async (): Promise<ChatConversation[]> => {
  try {
    const response = await axios.get(`${API_BASE}/get-chat-list`, {
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting chat list:', error);
    throw error;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await axios.patch(`${API_BASE}/mark-as-read/${messageId}`, {}, {
      withCredentials: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/delete-message/${messageId}`, {
      withCredentials: true
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Edit a message
export const editMessage = async (messageId: string, content: string): Promise<ApiMessage> => {
  try {
    const response = await axios.put(`${API_BASE}/edit-message/${messageId}`, {
      content
    }, {
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await axios.get(`${API_BASE}/getUnreadCount`, {
      withCredentials: true
    });
    return response.data.data.unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
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
    unreadCount: chat.unreadCount || 0
  };
};