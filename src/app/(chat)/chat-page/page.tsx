"use client"
import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import api from "../../utils/api"
import { Button } from "@/app/components/button"
import { ScrollArea } from "@/app/components/scroll-area"
import { Input } from "@/app/components/input"
import { Badge } from "@/app/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/dialog"
import { Send, Search, MoreVertical, Phone, Video, Users, Paperclip, Menu, X } from "lucide-react"
import { useSocket } from "@/app/utils/useSocket"
import {
  sendTextMessage,
  sendFileMessage,
  getMessages,
  getChatList,
  markMessageAsRead,
  deleteMessage,
  editMessage,
  formatMessage,
  formatChatUser,
  type Message
} from "@/app/utils/chatApi"
import type { ApiResponse, User as ApiUser, Message as ApiServerMessage, ChatUser, ChatRoom } from "@/app/types"
import { CreateGroupDialog } from "@/app/components/CreateGroupDialog"
import { GroupDetailsDialog } from "@/app/components/GroupDetailsDialog"
import { TypingIndicator } from "@/app/components/TypingIndicator"

type DirectoryUser = Pick<ApiUser, "_id" | "displayName" | "username" | "profilePic" | "isOnline">

type SocketMessagePayload = ApiServerMessage

const ChatPage = () => {
  const router = useRouter()
  
  // State management
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile] = useState(false)
  const [windowVisible, setWindowVisible] = useState(true)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    loadingMore: false
  })

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch current user and chat list
  const fetchUserAndChats = useCallback(async () => {
    try {
      const userRes = await api.get<ApiResponse<ApiUser>>("/api/users/getCurrentUser")
      const userData = userRes.data.data
      // Current user data loaded

      // Set user data first
      setCurrentUserId(userData._id)
      setCurrentUser(userData)

      // Small delay to ensure state is updated before socket connection
      setTimeout(() => {
        // User data set, socket should connect now
      }, 100);

      const chatRes = await getChatList()
      const formattedUsers = chatRes
        .map((chat) => formatChatUser(chat, userData._id))
        .filter((chat): chat is ChatUser => Boolean(chat))

      setUsers(formattedUsers)
      setSelectedUser((prev) => prev ?? formattedUsers[0] ?? null)
    } catch {
      // Error fetching user or chat data
    } finally {
      setLoading(false)
    }
  }, [])



  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<DirectoryUser[]>>("/api/users/getAlluser");
      if (response.data.success) {
        setAllUsers(response.data.data);
      }
    } catch {
      // Failed to fetch online users
    }
  }, []);

  // Window visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setWindowVisible(!document.hidden);
    };

    const handleFocus = () => setWindowVisible(true);
    const handleBlur = () => setWindowVisible(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchUserAndChats();
    // Also fetch online users initially
    fetchOnlineUsers();
  }, [fetchUserAndChats, fetchOnlineUsers]);

  // Socket event handlers
  const socketEvents = {
    onMessageReceived: useCallback((message: SocketMessagePayload) => {
      const senderDetails = typeof message.sender === "string" ? undefined : message.sender;
      const fromId = senderDetails?._id || (typeof message.sender === "string" ? message.sender : undefined);

      if (!fromId || !currentUserId) return;

      // Check if this message is from the currently active chat
      const isFromActiveChat = selectedUser && (
        (selectedUser.isGroup && message.room === selectedUser.userId) ||
        (!selectedUser.isGroup && fromId === selectedUser.userId)
      );

      // Add message to current conversation ONLY if it's from the active chat
      const formattedMessage = formatMessage(message, currentUserId);
      if (isFromActiveChat) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === formattedMessage.id);
          if (!exists) {
            return [...prev, formattedMessage];
          }
          return prev;
        });
      }

      // If message is from active chat and window is visible, mark it as read immediately
      if (isFromActiveChat && !formattedMessage.isOwn && windowVisible) {
        setTimeout(() => {
          markMessageAsRead(formattedMessage.id);
        }, 100); // Small delay to ensure message is processed
      }

      // Update chat list
      setUsers(prev => {
        const messageText = message.messageType === 'text'
          ? (message.content || '')
          : message.messageType.toUpperCase();
        const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

        // Handle group messages
        if (message.room) {
          const existingGroupIndex = prev.findIndex(u => u.isGroup && u.userId === message.room);
          if (existingGroupIndex !== -1) {
            const updated = [...prev];
            const target = updated[existingGroupIndex];
            
            // Only increment unread count if message is NOT from active chat (or window not visible) and not from self
            const unreadIncrement = ((isFromActiveChat && windowVisible) || formattedMessage.isOwn) ? 0 : 1;

            updated[existingGroupIndex] = {
              ...target,
              lastMessage: messageText,
              lastMessageTime: messageTime,
              unreadCount: target.unreadCount + unreadIncrement
            };

            // Move to top
            const [moved] = updated.splice(existingGroupIndex, 1);
            return [moved, ...updated];
          }
          return prev; // Group not found in list
        }

        // Handle DM messages
        const existingUserIndex = prev.findIndex(u => !u.isGroup && u.userId === fromId);
        if (existingUserIndex !== -1) {
          const updated = [...prev];
          const target = updated[existingUserIndex];
          
          // Only increment unread count if message is NOT from active chat (or window not visible)
          const unreadIncrement = (isFromActiveChat && windowVisible) ? 0 : 1;

          updated[existingUserIndex] = {
            ...target,
            lastMessage: messageText,
            lastMessageTime: messageTime,
            unreadCount: target.unreadCount + unreadIncrement
          };

          // Move to top
          const [moved] = updated.splice(existingUserIndex, 1);
          return [moved, ...updated];
        }

        // Create new DM chat entry (only for DMs, not groups)
        if (!message.room) {
          const senderName = senderDetails?.displayName || senderDetails?.username || 'New User';
          const senderAvatar = senderDetails?.profilePic || '';

          const newChatUser: ChatUser = {
            id: `chat-${fromId}`,
            userId: fromId,
            name: senderName,
            avatar: senderAvatar,
            lastMessage: messageText,
            lastMessageTime: messageTime,
            isOnline: true,
            unreadCount: (isFromActiveChat && windowVisible) ? 0 : 1, // No unread if from active chat and window visible
            isGroup: false
          };

          return [newChatUser, ...prev];
        }

        return prev;
      });
    }, [currentUserId, selectedUser, windowVisible]),

    onUserOnline: useCallback((userId: string) => {
      setUsers(prev => prev.map(user =>
        user.userId === userId ? { ...user, isOnline: true } : user
      ));
      setAllUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, isOnline: true } : user
      ));
    }, []),

    onUserOffline: useCallback((userId: string) => {
      setUsers(prev => prev.map(user =>
        user.userId === userId ? { ...user, isOnline: false } : user
      ));
      setAllUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, isOnline: false } : user
      ));
    }, []),

    onMessageRead: useCallback((messageId: string) => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
      
      // Update unread count in sidebar when a message is marked as read
      if (selectedUser) {
        setUsers(prev => prev.map(u =>
          u.userId === selectedUser.userId ? { ...u, unreadCount: Math.max(0, u.unreadCount - 1) } : u
        ));
      }
    }, [selectedUser]),

    onMessageDeleted: useCallback((messageId: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }, []),

    onMessageEdited: useCallback((updatedMessage: SocketMessagePayload) => {
      setMessages(prev => prev.map(msg =>
        msg.id === updatedMessage._id
          ? { ...msg, content: updatedMessage.content }
          : msg
      ));
    }, []),

    onTypingStart: useCallback((userId: string, roomId?: string) => {
      // Only show typing indicator if it's from the current chat
      if (!selectedUser) return;
      
      const isFromCurrentChat = selectedUser.isGroup 
        ? roomId === selectedUser.userId 
        : !roomId; // For DMs, roomId should be undefined
        
      if (isFromCurrentChat) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    }, [selectedUser]),

    onTypingStop: useCallback((userId: string, roomId?: string) => {
      // Only process typing stop if it's from the current chat
      if (!selectedUser) return;
      
      const isFromCurrentChat = selectedUser.isGroup 
        ? roomId === selectedUser.userId 
        : !roomId; // For DMs, roomId should be undefined
        
      if (isFromCurrentChat) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    }, [selectedUser]),

    onConnectionConfirmed: useCallback((data: { userId: string; status: string; message: string }) => {
      // Update current user's online status when connection is confirmed
      setCurrentUser(prev => prev ? { ...prev, isOnline: true } : prev);

      // Also update in allUsers array if it exists
      setAllUsers(prev => prev.map(user =>
        user._id === data.userId ? { ...user, isOnline: true } : user
      ));
    }, []),

    // Group Chat Events
    onGroupChatCreated: useCallback((room: ChatRoom) => {
      // Add new group to the list
      const newGroupUser: ChatUser = {
        id: room._id,
        userId: room._id,
        name: room.name,
        avatar: room.groupImage || '', // Use the group image from the room
        lastMessage: 'Group created',
        lastMessageTime: new Date(room.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOnline: false,
        unreadCount: 0,
        isGroup: true,
        admins: room.admins?.map(u => u._id) || [],
        participants: room.participants?.map(u => u._id) || []
      };
      
      // Check if group already exists to avoid duplicates
      setUsers(prev => {
        const existingIndex = prev.findIndex(u => u.userId === room._id);
        if (existingIndex !== -1) {
          // Update existing group
          const updated = [...prev];
          updated[existingIndex] = newGroupUser;
          return updated;
        } else {
          // Add new group to the beginning of the list
          return [newGroupUser, ...prev];
        }
      });

      // Auto-select the newly created group if no other user is selected
      setSelectedUser(prev => {
        if (!prev) {
          return newGroupUser;
        }
        return prev;
      });
    }, []),

    onAddedToGroup: useCallback((room: ChatRoom) => {
      // Similar to created, add to list
      const newGroupUser: ChatUser = {
        id: room._id,
        userId: room._id,
        name: room.name,
        avatar: room.groupImage || '',
        description: room.description,
        lastMessage: 'You were added to the group',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOnline: false,
        unreadCount: 1,
        isGroup: true,
        admins: room.admins?.map(u => u._id) || [],
        participants: room.participants?.map(u => u._id) || []
      };
      
      // Check if group already exists to avoid duplicates
      setUsers(prev => {
        const existingIndex = prev.findIndex(u => u.userId === room._id);
        if (existingIndex !== -1) {
          // Update existing group
          const updated = [...prev];
          updated[existingIndex] = newGroupUser;
          return updated;
        } else {
          // Add new group to the beginning of the list
          return [newGroupUser, ...prev];
        }
      });
    }, []),

    onGroupUpdated: useCallback((room: ChatRoom) => {
      setUsers(prev => prev.map(u => {
        if (u.userId === room._id) {
          return {
            ...u,
            name: room.name,
            avatar: room.groupImage || u.avatar,
            description: room.description,
            admins: room.admins?.map(user => user._id) || [],
            participants: room.participants?.map(user => user._id) || []
          };
        }
        return u;
      }));

      // Also update selected user if it's this group
      setSelectedUser(prev => {
        if (prev?.userId === room._id) {
          return {
            ...prev,
            name: room.name,
            avatar: room.groupImage || prev.avatar,
            description: room.description,
            admins: room.admins?.map(user => user._id) || [],
            participants: room.participants?.map(user => user._id) || []
          };
        }
        return prev;
      });
    }, []),

    onParticipantLeft: useCallback((data: { roomId: string; leftUserId: string }) => {
      setUsers(prev => {
        // If current user left/removed, remove from list
        if (data.leftUserId === currentUserId) {
          const filtered = prev.filter(u => u.userId !== data.roomId);
          // Also clear selected user if it was this room
          setSelectedUser(current => current?.userId === data.roomId ? null : current);
          setMessages(current => current.length > 0 ? [] : current);
          return filtered;
        } else {
          // Update participant list in state
          return prev.map(u => {
            if (u.userId === data.roomId && u.participants) {
              return {
                ...u,
                participants: u.participants.filter(id => id !== data.leftUserId)
              };
            }
            return u;
          });
        }
      });
    }, [currentUserId])
  };

  // Initialize socket connection
  const { isConnected, joinConversation, joinGroup, startTyping, stopTyping } = useSocket(currentUserId, socketEvents);

  // Debug socket connection status
  useEffect(() => {
    // Socket connection status monitoring
  }, [isConnected, currentUserId]);

  // Periodic refresh of online users
  useEffect(() => {
    if (currentUserId && isConnected) {
      fetchOnlineUsers(); // Fetch immediately when connected

      const interval = setInterval(() => {
        fetchOnlineUsers();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentUserId, isConnected, fetchOnlineUsers]);

  // Load messages with pagination support
  const loadMessages = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    if (!selectedUser || !currentUserId) return;

    if (isLoadMore) {
      setPagination(prev => ({ ...prev, loadingMore: true }));
    } else {
      setMessagesLoading(true);
    }

    try {
      // Determine if we're fetching for a group or DM
      const params = selectedUser.isGroup
        ? { room: selectedUser.userId, page, limit: 20 }
        : { receiver: selectedUser.userId, page, limit: 20 };

      const response = await getMessages(params);
      const formattedMessages = response.messages.map((msg) => formatMessage(msg, currentUserId));
      
      // Since backend now returns newest first, reverse for chronological display
      const chronologicalMessages = formattedMessages.reverse();

      if (isLoadMore) {
        // Prepend older messages to the beginning
        setMessages(prev => [...chronologicalMessages, ...prev]);
      } else {
        // Replace all messages for initial load
        setMessages(chronologicalMessages);
        
        // Mark messages as read for initial load
        const unreadMessages = chronologicalMessages.filter((m) => !m.isRead && !m.isOwn);
        if (unreadMessages.length > 0) {
          unreadMessages.forEach((msg) => {
            markMessageAsRead(msg.id);
          });

          // Update unread count in UI
          setUsers(prev => prev.map(u =>
            u.userId === selectedUser.userId ? { ...u, unreadCount: 0 } : u
          ));
        }

        // Join group room if it's a group chat
        if (selectedUser.isGroup) {
          joinGroup(selectedUser.userId);
        } else {
          joinConversation(selectedUser.userId);
        }
      }

      // Update pagination state
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.currentPage < response.pagination.totalPages,
        loadingMore: false
      });

    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      if (isLoadMore) {
        setPagination(prev => ({ ...prev, loadingMore: false }));
      } else {
        setMessagesLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [selectedUser, currentUserId, joinConversation, joinGroup]);

  // Load initial messages when user is selected
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;
    
    // Reset pagination and load first page
    setPagination({
      currentPage: 1,
      totalPages: 1,
      hasMore: true,
      loadingMore: false
    });
    
    loadMessages(1, false);
  }, [selectedUser, currentUserId, loadMessages]);

  // Mark messages as read when window becomes visible and user is viewing a chat
  useEffect(() => {
    if (!selectedUser || !currentUserId || !windowVisible) return;

    // Mark all unread messages in the current chat as read
    const unreadMessages = messages.filter(msg => !msg.isRead && !msg.isOwn);
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        markMessageAsRead(msg.id);
      });

      // Update local state to reflect read status
      setMessages(prev => prev.map(msg => 
        (!msg.isRead && !msg.isOwn) ? { ...msg, isRead: true } : msg
      ));

      // Update unread count in chat list
      setUsers(prev => prev.map(u =>
        u.userId === selectedUser.userId ? { ...u, unreadCount: 0 } : u
      ));
    }
  }, [selectedUser, currentUserId, windowVisible, messages]);

  // Infinite scroll handler for loading older messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight } = element;
    
    // Check if user scrolled to top (threshold of 100px from top)
    const isNearTop = scrollTop <= 100;
    
    if (isNearTop && pagination.hasMore && !pagination.loadingMore && !messagesLoading) {
      // Save current scroll position to restore after loading
      const previousScrollHeight = scrollHeight;
      
      // Load older messages
      loadMessages(pagination.currentPage + 1, true).then(() => {
        // Restore scroll position after loading older messages
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            messagesContainerRef.current.scrollTop = scrollTop + scrollDiff;
          }
        }, 100);
      });
    }
  }, [pagination.hasMore, pagination.loadingMore, pagination.currentPage, messagesLoading, loadMessages]);

  // Scroll to bottom when messages change (only for new messages, not pagination)
  useEffect(() => {
    if (!pagination.loadingMore) {
      scrollToBottom();
    }
  }, [messages, pagination.loadingMore]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedUser || !currentUserId) return;

    setSendingMessage(true);

    try {
      // Handle file upload
      if (selectedFile) {
        // Create optimistic file message
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          senderId: currentUserId,
          content: newMessage.trim(),
          messageType: selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('video/') ? 'video' : 'file',
          fileUrl: selectedFilePreview || undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: true,
          isRead: false,
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);

        // Send file message
        const response = await sendFileMessage(
          selectedUser.userId,
          selectedFile,
          newMessage.trim(),
          selectedUser.isGroup
        );

        // Update message with real data
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, id: response._id, fileUrl: response.fileUrl, content: response.content || tempMessage.content }
            : msg
        ));

        // Update sidebar
        setUsers(prev => prev.map(user =>
          user.userId === selectedUser.userId
            ? {
              ...user,
              lastMessage: response.content || (response.messageType ? response.messageType.toUpperCase() : 'FILE'),
              lastMessageTime: tempMessage.timestamp
            }
            : user
        ));

        setSelectedFile(null);
        setSelectedFilePreview(null);
        setNewMessage("");
        return;
      }

      // Handle text message
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        senderId: currentUserId,
        content: newMessage.trim(),
        messageType: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const messageToSend = newMessage.trim();

      // Add optimistic message
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");

      // Send text message
      const response = await sendTextMessage(selectedUser.userId, messageToSend, selectedUser.isGroup);

      // Update temp message with real ID
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, id: response._id }
          : msg
      ));

      // Update sidebar
      setUsers(prev => prev.map(user =>
        user.userId === selectedUser.userId
          ? {
            ...user,
            lastMessage: messageToSend,
            lastMessageTime: tempMessage.timestamp
          }
          : user
      ));

    } catch {
      // Error sending message
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      if (!selectedFile) {
        setNewMessage(newMessage); // Restore text message
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewChat = (user: DirectoryUser) => {
    const existingUser = users.find((u) => u.userId === user._id);
    if (existingUser) {
      setSelectedUser(existingUser);
    } else {
      const newChatUser: ChatUser = {
        id: `new-${user._id}`,
        userId: user._id,
        name: user.displayName || user.username || 'Unknown User',
        avatar: user.profilePic || '',
        lastMessage: "",
        lastMessageTime: "",
        isOnline: user.isOnline || false,
        unreadCount: 0,
        isGroup: false
      };
      setUsers(prev => [newChatUser, ...prev]);
      setSelectedUser(newChatUser);
    }
    setShowUserModal(false);
    setUserSearchQuery("");
  };

  const handleUserSelect = (user: ChatUser) => {
    setMessages([]); // Clear messages when switching users
    setSelectedUser(user);
    // Close mobile menu when user is selected
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSelectedFilePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setSelectedFilePreview(null)
    }
  }

  const handleMessageContext = async (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    if (!message.isOwn) return;

    const canEdit = message.messageType === "text" || !message.messageType;
    const action = window.prompt(`Action? type: ${canEdit ? "edit/delete" : "delete"}`);
    if (!action) return;

    try {
      if (action.toLowerCase() === "delete") {
        await deleteMessage(message.id);
        setMessages(prev => prev.filter(m => m.id !== message.id));
      } else if (canEdit && action.toLowerCase() === "edit") {
        const newText = window.prompt("Edit message", message.content);
        if (newText == null || newText.trim() === "") return;

        const updated = await editMessage(message.id, newText.trim());
        setMessages(prev => prev.map(m =>
          m.id === message.id
            ? { ...m, content: updated.content }
            : m
        ));
      }
    } catch {
      // Failed to perform message action
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (selectedUser && isConnected) {
      const targetUserId = selectedUser.isGroup ? undefined : selectedUser.userId;
      const roomId = selectedUser.isGroup ? selectedUser.userId : undefined;
      
      startTyping(targetUserId, roomId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 3000);
    }
  };

  const handleTypingStop = () => {
    if (selectedUser && isConnected) {
      const targetUserId = selectedUser.isGroup ? undefined : selectedUser.userId;
      const roomId = selectedUser.isGroup ? selectedUser.userId : undefined;
      
      stopTyping(targetUserId, roomId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Filtered lists for UI
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter((user) => {
    // Exclude current user from the list
    if (user._id === currentUserId) return false;

    const searchTerm = userSearchQuery.toLowerCase();
    const displayName = (user.displayName || '').toLowerCase();
    const username = (user.username || '').toLowerCase();

    return displayName.includes(searchTerm) || username.includes(searchTerm);
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile
          ? `fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white/90 backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`
          : 'w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl'
        } flex flex-col
      `}>
        <div className="p-4 border-b border-gradient-to-r from-blue-200/30 to-purple-200/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-purple-100/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Messages</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Profile Button - Instagram style with connection status */}
              {currentUser ? (
                <Link
                  href="/profile"
                  className="group relative flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  title={`Go to Profile (${isConnected ? "Connected" : "Disconnected"})`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-500 ring-offset-1 transition-all duration-200 group-hover:ring-blue-600">
                      <AvatarImage
                        src={currentUser.profilePic && currentUser.profilePic !== "" ? currentUser.profilePic : undefined}
                        alt={currentUser.displayName || currentUser.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm">
                        {(currentUser.displayName || currentUser.username || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Connection status indicator overlaid on profile picture */}
                    <div
                      className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${currentUser?.isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                      title={`Socket: ${isConnected ? "Connected" : "Disconnected"} - User: ${currentUser?.isOnline ? "Online" : "Offline"} - Combined: ${isConnected && currentUser?.isOnline ? "Should be Green" : "Should be Red"}`}
                    />
                  </div>
                  {/* Username text - appears on hover */}
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                    {currentUser.displayName || currentUser.username}
                  </span>
                </Link>
              ) : (
                /* Fallback connection status if no user */
                <div
                  className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  title={`${isConnected ? "Socket Connected" : "Socket Disconnected"} - No User Data`}
                />
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-purple-200 focus:border-purple-400 focus:ring-purple-300/30 rounded-xl"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                onDoubleClick={() => {
                  if (user.isGroup) {
                    router.push(`/group-details/${user.userId}`)
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${selectedUser?.id === user.id ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-purple-200 shadow-lg" : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 hover:shadow-md"
                  }`}
                title={user.isGroup ? "Double-click to view group details" : ""}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-gradient-to-r from-blue-400 to-purple-400 ring-offset-2">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                    <span className="text-xs text-gray-500">{user.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{user.lastMessage}</p>
                </div>
                {user.unreadCount > 0 && (
                  <Badge variant="default" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg animate-pulse">
                    {user.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Create Group Button / New Chat Button */}
        <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-2">
          <Dialog open={showUserModal} onOpenChange={(open) => {
            setShowUserModal(open);
            if (open) {
              // Fetch fresh user list when modal opens
              fetchOnlineUsers();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                <Users className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {filteredAllUsers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {allUsers.length === 0 ? 'Loading users...' : 'No users found'}
                      </div>
                    ) : (
                      filteredAllUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleStartNewChat(user)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          <Avatar>
                            <AvatarImage src={user.profilePic} />
                            <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.displayName || user.username}</p>
                            <p className="text-xs text-gray-500">{user.isOnline ? "Online" : "Offline"}</p>
                          </div>
                        </div>
                      )))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          <CreateGroupDialog
            users={allUsers}
            currentUserId={currentUserId || ''}
            onGroupCreated={(newGroup: ChatRoom) => {
              // Create the group user entry
              const newGroupUser: ChatUser = {
                id: newGroup._id,
                userId: newGroup._id,
                name: newGroup.name,
                avatar: newGroup.groupImage || '',
                description: newGroup.description,
                lastMessage: 'Group created',
                lastMessageTime: new Date(newGroup.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isOnline: false,
                unreadCount: 0,
                isGroup: true,
                admins: newGroup.admins?.map(u => u._id) || [],
                participants: newGroup.participants?.map(u => u._id) || []
              };
              
              // Optimistically add the group to the list (socket event will also handle this, but this ensures immediate UI update)
              setUsers(prev => {
                const existingIndex = prev.findIndex(u => u.userId === newGroup._id);
                if (existingIndex !== -1) {
                  // Already exists (maybe from socket), just update
                  const updated = [...prev];
                  updated[existingIndex] = newGroupUser;
                  return updated;
                } else {
                  // Add new group to the beginning
                  return [newGroupUser, ...prev];
                }
              });
              
              // Auto-select the newly created group
              setSelectedUser(newGroupUser);
            }}
          >
            <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-105">
              <Users className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </CreateGroupDialog>
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedUser ? (
        <>
          <div className="flex-1 flex flex-col min-w-0 bg-white/70 backdrop-blur-xl shadow-2xl">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-200/50 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden mr-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div 
                  className={selectedUser.isGroup ? "cursor-pointer" : ""}
                  onClick={() => {
                    if (selectedUser.isGroup) {
                      router.push(`/group-details/${selectedUser.userId}`)
                    }
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
                    <AvatarFallback>
                      {selectedUser.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedUser.name}</h2>
                  {selectedUser.isGroup ? (
                    <p className="text-xs text-gray-500">
                      {selectedUser.participants?.length || 0} participants
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {selectedUser.isOnline ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-600"></span>
                          Online
                        </span>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" title="Call">
                  <Phone className="h-5 w-5 text-gray-500" />
                </Button>
                <Button variant="ghost" size="sm" title="Video Call">
                  <Video className="h-5 w-5 text-gray-500" />
                </Button>

                {selectedUser.isGroup ? (
                  <GroupDetailsDialog group={selectedUser}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </Button>
                  </GroupDetailsDialog>
                ) : (
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 p-4" 
              ref={messagesContainerRef}
              onScrollCapture={handleScroll}
            >
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Load More button for older messages */}
                  {pagination.hasMore && !pagination.loadingMore && messages.length > 0 && (
                    <div className="flex justify-center py-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadMessages(pagination.currentPage + 1, true)}
                        className="text-sm"
                      >
                        Load older messages
                      </Button>
                    </div>
                  )}
                  
                  {/* Loading indicator for older messages */}
                  {pagination.loadingMore && (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading older messages...</span>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`} onContextMenu={(e) => handleMessageContext(e, message)}>
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] ${message.isOwn ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-200/50"}`}>
                        {/* Show sender name for messages from others */}
                        {!message.isOwn && (
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            {users.find(u => u.userId === message.senderId)?.name || "Unknown User"}
                          </div>
                        )}
                        {message.messageType && message.messageType !== "text" ? (
                          <div className="space-y-2">
                            {message.messageType === "image" && message.fileUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={message.fileUrl} alt="image" className="rounded-md max-h-64 object-contain" />
                            )}
                            {message.messageType === "video" && message.fileUrl && (
                              <video src={message.fileUrl} controls className="rounded-md max-h-64" />
                            )}
                            {message.messageType === "file" && message.fileUrl && (
                              <a href={message.fileUrl} target="_blank" rel="noreferrer" className="underline break-all">
                                Download file
                              </a>
                            )}
                            {message.content && <p className="text-base whitespace-pre-wrap break-words">{message.content}</p>}
                          </div>
                        ) : (
                          <p className="text-base whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        <div className="flex items-center gap-1">
                          {message.isOwn && message.isRead && (
                            <span title="Read" className="ml-1 text-green-300 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <TypingIndicator 
                      users={Array.from(typingUsers).map(userId => {
                        // Find user details from the users list or selected user for direct chats
                        const user = users.find(u => u.userId === userId || u.id === userId);
                        if (user) {
                          return {
                            id: userId,
                            name: user.name,
                            avatar: user.avatar
                          };
                        }
                        
                        // Fallback: if it's the selected user typing in a direct chat
                        if (selectedUser && !selectedUser.isGroup && selectedUser.userId === userId) {
                          return {
                            id: userId,
                            name: selectedUser.name,
                            avatar: selectedUser.avatar
                          };
                        }
                        
                        // Final fallback
                        return {
                          id: userId,
                          name: 'Unknown User',
                          avatar: undefined
                        };
                      })}
                    />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 backdrop-blur-sm border-t border-purple-200/50 p-3 md:p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                {selectedFilePreview && (
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-purple-200/50">
                    {selectedFile?.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedFilePreview} alt="preview" className="h-10 w-10 object-cover rounded-lg shadow-md" />
                    ) : selectedFile?.type.startsWith("video/") ? (
                      <span className="text-sm font-medium text-purple-700">📹 Video selected</span>
                    ) : (
                      <span className="text-sm font-medium text-blue-700">📄 File selected</span>
                    )}
                    <button type="button" className="text-xs text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-full transition-colors" onClick={() => { setSelectedFile(null); setSelectedFilePreview(null); }}>✕</button>
                  </div>
                )}
                <Input
                  placeholder={
                    selectedUser
                      ? `Message ${selectedUser.name}...`
                      : "Type a message..."
                  }
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim()) {
                      handleTypingStart();
                    } else {
                      handleTypingStop();
                    }
                  }}
                  onBlur={handleTypingStop}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 focus:ring-purple-300/30 rounded-2xl px-4 py-3"
                />
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePickFile}
                  title="Attach file"
                  className="p-3 rounded-2xl border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 transform hover:scale-105"
                >
                  <Paperclip className="h-4 w-4 text-purple-600" />
                </Button>
                <Button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                  title={!isConnected ? "Send message (will be delivered when online)" : "Send message"}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className={`h-4 w-4 ${sendingMessage ? 'animate-pulse' : ''}`} />
                </Button>
              </form>
            </div>
          </div>
        </>
      ) : (
        // Empty State
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200/50 p-4 md:hidden">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="font-semibold text-gray-900">Messages</h2>
              <div className="w-10" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                <Send className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">No conversation selected</h3>
              <p className="text-gray-600 max-w-sm mx-auto text-lg">
                ✨ Choose a conversation from the sidebar or start a new one to begin chatting! ✨
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ChatPage