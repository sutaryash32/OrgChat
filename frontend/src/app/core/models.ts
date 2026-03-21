export interface User {
  id: string;
  merID: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  ssoProvider: string;
}

export interface UserSummary {
  merID: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  mediaId?: string;
  timestamp: string;
  read: boolean;
  action?: 'SEND' | 'EDIT' | 'DELETE';
}

export interface Media {
  id: string;
  uploaderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  timestamp: string;
  expiry?: string;
}

export interface MediaCache {
  [mediaId: string]: Media;
}

export interface MultiMessageRequest {
  recipientIds: string[];
  content?: string;
  mediaId?: string;
}

export interface ConversationSummary {
  partnerMerID: string;
  partnerDisplayName: string;
  partnerAvatarUrl?: string;
  lastMessage: string;
  lastMediaId?: string;
  lastTimestamp: string;
  unreadCount: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  merID: string;
  email: string;
  displayName: string;
  expiresIn: number;
}

export interface PageResponse<T>
{
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
