export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_at?: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
  code?: string;
}

export interface PokeStatus {
  online: boolean;
  version?: string;
  uptime?: number;
}
