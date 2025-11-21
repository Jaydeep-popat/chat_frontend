"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import { Button } from "@/app/components/button"
import { ScrollArea } from "@/app/components/scroll-area"
import { Input } from "@/app/components/input"
import { Badge } from "@/app/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/dialog"
import { Send, Search, MoreVertical, Phone, Video, Users, Paperclip, Menu, ArrowLeft, X } from "lucide-react"
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
  type Message,
  type ChatUser
} from "@/app/utils/chatApi"
import type { ApiResponse, User as ApiUser, Message as ApiServerMessage } from "@/app/types"

type DirectoryUser = Pick<ApiUser, "_id" | "displayName" | "username" | "profilePic" | "isOnline">

type SocketMessagePayload = ApiServerMessage

const ChatPage = () => {
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
  const [isMobile, setIsMobile] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch current user and chat list
  const fetchUserAndChats = useCallback(async () => {
      try {
      const userRes = await axios.get<ApiResponse<ApiUser>>("/api/users/getCurrentUser", { withCredentials: true })
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

  // Socket event handlers
  const socketEvents = {
    onMessageReceived: useCallback((message: SocketMessagePayload) => {
      const senderDetails = typeof message.sender === "string" ? undefined : message.sender;
      const fromId = senderDetails?._id || (typeof message.sender === "string" ? message.sender : undefined);
      
      if (!fromId || !currentUserId) return;

      // Add message to current conversation if relevant
      if (selectedUser?.userId === fromId || fromId !== currentUserId) {
        const formattedMessage = formatMessage(message, currentUserId);
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === formattedMessage.id);
          if (exists) return prev;
          return [...prev, formattedMessage];
        });
      }

      // Update chat list
      setUsers(prev => {
        const existingUserIndex = prev.findIndex(u => u.userId === fromId);
        const messageText = message.messageType === 'text' 
          ? (message.content || '') 
          : message.messageType.toUpperCase();
        const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

        if (existingUserIndex !== -1) {
          const updated = [...prev];
          const target = updated[existingUserIndex];
          const unreadIncrement = selectedUser?.userId === fromId ? 0 : 1;
          
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

        // Create new chat entry
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
          unreadCount: selectedUser?.userId === fromId ? 0 : 1
        };

        return [newChatUser, ...prev];
      });
    }, [currentUserId, selectedUser]),

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
    }, []),

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

    onTypingStart: useCallback((userId: string) => {
      setTypingUsers(prev => new Set(prev).add(userId));
    }, []),

    onTypingStop: useCallback((userId: string) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }, []),

    onConnectionConfirmed: useCallback((data: { userId: string; status: string; message: string }) => {
      fetchUserAndChats();
      
      // Update current user's online status
      if (currentUserId === data.userId) {
        setCurrentUser(prev => prev ? { ...prev, isOnline: true } : prev);
      }
    }, [fetchUserAndChats, currentUserId])
  };

  // Initialize socket connection
  const { isConnected, joinConversation, startTyping, stopTyping } = useSocket(currentUserId, socketEvents);
  
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
  }, [currentUserId, isConnected]);

  // Load messages for selected user
  const loadMessages = useCallback(async (receiverId: string) => {
    if (!receiverId || !currentUserId) return;

    setMessagesLoading(true);
    try {
      const response = await getMessages({ receiver: receiverId });
      const formattedMessages = response.messages.map((msg: ApiServerMessage) => 
        formatMessage(msg, currentUserId)
      );
      setMessages(formattedMessages);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUserId]);

  // Mark as read when last message is from the other user
  useEffect(() => {
    if (
      messages.length > 0 &&
      currentUserId &&
      selectedUser &&
      messages[messages.length - 1].senderId === selectedUser.userId &&
      !messages[messages.length - 1].isRead
    ) {
      const lastMsg = messages[messages.length - 1];
      markMessageAsRead(lastMsg.id).catch(() => {});
    }
  }, [messages, currentUserId, selectedUser]);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when user is selected
  useEffect(() => {
    if (selectedUser && isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [selectedUser, isMobile])

  // Fetch current user and chat list on mount
  useEffect(() => {
    fetchUserAndChats();
  }, [fetchUserAndChats]);

  // Fetch all users for the modal
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get<ApiResponse<DirectoryUser[]>>("/api/users/getAlluser", { withCredentials: true })
      const filteredUsers = response.data.data.filter((user) => user._id !== currentUserId)
      setAllUsers(filteredUsers)
    } catch {
      // Error fetching all users
    }
  }

  // Fetch online users for real-time status
  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.post<ApiResponse<DirectoryUser[]>>("/api/users/getOnlineUsers", {}, { withCredentials: true })
      const onlineUserIds = response.data.data.map((user) => user._id)
      
      setAllUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          isOnline: onlineUserIds.includes(user._id)
        }))
      )
      
      // Also update the users in the main chat list
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          isOnline: onlineUserIds.includes(user.userId)
        }))
      )
    } catch {
      // Error fetching online users
    }
  }

  // Handle selected user changes - load messages and join conversation
  useEffect(() => {
    if (selectedUser && currentUserId && isConnected) {
      setMessages([]); // Clear messages when switching users
      joinConversation(selectedUser.userId);
      loadMessages(selectedUser.userId);
    }
  }, [selectedUser, currentUserId, isConnected, joinConversation, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending messages
        const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || sendingMessage) {
          return;
        }

    if (!newMessage.trim() && !selectedFile) {
      return;
    }

    setSendingMessage(true);

    try {
      // Handle file message
    if (selectedFile) {
        const tempId = `temp-${Date.now()}`;
        const isImage = selectedFile.type.startsWith("image/");
        const isVideo = selectedFile.type.startsWith("video/");
        const messageType = isImage ? "image" : isVideo ? "video" : "file";

        // Add optimistic message
        const tempMessage: Message = {
        id: tempId,
        senderId: currentUserId!,
          content: messageType.toUpperCase(),
          messageType,
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
          newMessage.trim() || undefined
        );

        // Update temp message with real data
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
                lastMessage: response.content || messageType.toUpperCase(), 
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
      senderId: currentUserId!,
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
      const response = await sendTextMessage(selectedUser.userId, messageToSend);

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

      // Manual socket notification as fallback (if needed)

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
      startTyping(selectedUser.userId);
      
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
      stopTyping(selectedUser.userId);
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

  const filteredAllUsers = allUsers.filter((user) =>
    user.displayName.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
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
          ? `fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }` 
          : 'w-80 bg-white border-r border-gray-200'
        } flex flex-col
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
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
                      className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                        currentUser?.isOnline ? "bg-green-500" : "bg-red-500"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>
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
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    {user.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* Find Users Button */}
        <div className="p-4 border-t border-gray-200">
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 bg-transparent"
                onClick={() => {
                  fetchAllUsers()
                  fetchOnlineUsers()
                }}
              >
                <Users className="h-4 w-4" />
                Find Users
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {filteredAllUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleStartNewChat(user)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePic && user.profilePic !== "" ? user.profilePic : undefined} alt={user.displayName} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {(user.displayName || user.username)
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-500">
                            {user.isOnline ? "Online" : "Offline • Messages will be delivered when online"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredAllUsers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No users found</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Mobile Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="p-2 mr-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.avatar && selectedUser.avatar !== "" ? selectedUser.avatar : undefined} alt={selectedUser.name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {selectedUser.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedUser.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedUser.isOnline ? "Online" : "Offline • Messages will be delivered when online"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`} onContextMenu={(e) => handleMessageContext(e, message)}>
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${message.isOwn ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}>
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
                            {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <p className={`text-xs mt-1 ${message.isOwn ? "text-blue-100" : "text-gray-500"}`}>{message.timestamp}</p>
                          {message.isOwn && message.isRead && (
                            <span title="Read" className="ml-1 text-green-300 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="bg-white border-t border-gray-200 p-3 md:p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                {selectedFilePreview && (
                  <div className="flex items-center gap-2">
                    {selectedFile?.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedFilePreview} alt="preview" className="h-10 w-10 object-cover rounded" />
                    ) : selectedFile?.type.startsWith("video/") ? (
                      <span className="text-sm">Video selected</span>
                    ) : (
                      <span className="text-sm">File selected</span>
                    )}
                    <button type="button" className="text-xs text-red-600" onClick={() => { setSelectedFile(null); setSelectedFilePreview(null); }}>Clear</button>
                  </div>
                )}
                <Input
                  placeholder={
                    typingUsers.has(selectedUser?.userId || '') 
                      ? `${selectedUser?.name} is typing...` 
                      : selectedUser 
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
                  className="flex-1"
                />
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePickFile} 
                  title="Attach file"
                  className="p-2 md:px-3"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  type="submit" 
                  disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                  title={!isConnected ? "Send message (will be delivered when online)" : "Send message"}
                  className="p-2 md:px-3"
                >
                  <Send className={`h-4 w-4 ${sendingMessage ? 'animate-pulse' : ''}`} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          // Show messages even when no user is selected (for new conversations)
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div className={`${isMobile ? 'flex-1 text-center' : 'text-center'}`}>
                  <h2 className="font-semibold text-gray-900">Messages</h2>
                  <p className="text-sm text-gray-500">Select a conversation or view incoming messages</p>
                </div>
                {isMobile && <div className="w-10" />} {/* Spacer for centering */}
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`} onContextMenu={(e) => handleMessageContext(e, message)}>
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${message.isOwn ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}>
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
                            {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <p className={`text-xs mt-1 ${message.isOwn ? "text-blue-100" : "text-gray-500"}`}>{message.timestamp}</p>
                          {message.isOwn && message.isRead && (
                            <span title="Read" className="ml-1 text-green-300 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
