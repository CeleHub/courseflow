"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@/types";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_BADGE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: "bg-indigo-100 text-indigo-700",
  [Role.HOD]: "bg-violet-100 text-violet-700",
  [Role.LECTURER]: "bg-sky-100 text-sky-700",
  [Role.STUDENT]: "bg-emerald-100 text-emerald-700",
};

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0][0] || "").toUpperCase();
  }
  return (email[0] || "?").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

function getAvatarColor(name: string | null, email: string): string {
  const str = (name || email) || "user";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Topbar({
  onMenuClick,
  className,
}: {
  onMenuClick?: () => void;
  className?: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-14 z-50 bg-white border-b border-gray-200",
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger (mobile) or Logo (desktop) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-w-[44px] min-h-[44px] touch-manipulation"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-indigo-600 hover:text-indigo-700 focus:outline focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
          >
            CourseFlow
          </Link>
        </div>

        {/* Right: Desktop - bell + role + avatar dropdown | Mobile - avatar only */}
        <div className="flex items-center gap-3">
          {/* Desktop: notification + role badge + avatar */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="min-w-[44px] min-h-[44px] touch-manipulation"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            {user && (
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"
                )}
              >
                {user.role}
              </span>
            )}
          </div>

          {/* User avatar + dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm",
                    getAvatarColor(user.name, user.email)
                  )}
                  aria-label="User menu"
                >
                  {getInitials(user.name, user.email)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
