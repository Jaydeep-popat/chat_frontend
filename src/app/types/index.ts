// Global TypeScript interfaces for the application

export interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  fullName?: string;
  profilePic?: string;
  isOnline: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
  stack?: string;
}

export interface Message {
  _id: string;
  sender: User | string;
  receiver?: User | string;
  room?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string;
  isEdited?: boolean;
  deleted?: boolean;
  read?: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  _id: string;
  lastMessage: Message;
  sender: User;
  receiver: User;
  room?: ChatRoom;
  unreadCount: number;
}

export interface FormData {
  [key: string]: string | File | undefined;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  profilePic?: File;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface VerifyOtpFormData {
  email: string;
  otp: string;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileFormData {
  username?: string;
  displayName?: string;
  email?: string;
  profilePic?: File;
}

export interface SocketEvents {
  onMessageReceived?: (message: Message) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onMessageRead?: (messageId: string, readerId: string) => void;
  onMessageDeleted?: (messageId: string) => void;
  onMessageEdited?: (updatedMessage: Message) => void;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
  onConnectionConfirmed?: (data: { userId: string; status: string; message: string }) => void;
}

export interface FileUploadResponse {
  url: string;
  public_id: string;
}

export interface PaginationData {
  totalMessages: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: PaginationData;
}

export interface OnlineUser {
  _id: string;
  username: string;
  displayName: string;
  isOnline: boolean;
}