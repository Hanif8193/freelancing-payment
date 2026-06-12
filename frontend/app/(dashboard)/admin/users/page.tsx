"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import { formatDate, truncateAddress } from "@/lib/utils";
import type { User } from "@/types/user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<User[]>("/api/admin/users")
      .then((r) => setUsers(r.data))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (userId: string) => {
    setToggling(userId);
    try {
      const res = await api.patch<User>(`/api/admin/users/${userId}/toggle-active`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      toast.success(`User ${res.data.is_active ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setToggling(null);
    }
  };

  const roleVariant = (role: string) =>
    role === "ADMIN" ? "destructive" : role === "FREELANCER" ? "info" : "success";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">{users.length} registered users</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(u.role) as "destructive" | "info" | "success"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.wallet_address ? truncateAddress(u.wallet_address) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "success" : "secondary"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(u.id)}
                        disabled={toggling === u.id}
                        className="h-7 text-xs"
                      >
                        {toggling === u.id ? "…" : u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
