export const UserRole = {
  FREELANCER: "FREELANCER",
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  bio: string | null;
  wallet_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: "FREELANCER" | "CLIENT";
}

export interface LoginRequest {
  email: string;
  password: string;
}
