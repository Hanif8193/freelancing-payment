import api from "./api";
import type { AuthTokenResponse, LoginRequest, RegisterRequest, User } from "@/types/user";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

export const authService = {
  async register(data: RegisterRequest): Promise<AuthTokenResponse> {
    const res = await api.post<AuthTokenResponse>("/api/auth/register", data);
    authService.storeSession(res.data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<AuthTokenResponse> {
    const res = await api.post<AuthTokenResponse>("/api/auth/login", data);
    authService.storeSession(res.data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>("/api/auth/me");
    return res.data;
  },

  async updateMe(data: { full_name?: string; bio?: string }): Promise<User> {
    const res = await api.patch<User>("/api/auth/me", data);
    return res.data;
  },

  storeSession(data: AuthTokenResponse): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!authService.getToken();
  },
};
