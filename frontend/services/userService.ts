import api from "./api";
import type { User } from "@/types/user";

export const userService = {
  async getUserByEmail(email: string): Promise<User> {
    const res = await api.get<User>("/api/users/by-email", { params: { email } });
    return res.data;
  },
};
