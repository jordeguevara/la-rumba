"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers";
import { AuthModal } from "./AuthModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

export function Navbar() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 glass border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-gradient-pink">
            La Rumba
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/submit">
            <Button
              size="sm"
              className="gradient-pink border-0 text-white font-semibold rounded-full h-8 px-4 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Event
            </Button>
          </Link>

          {user ? (
            <button onClick={() => setAuthOpen(true)}>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={user.photoURL ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {user.displayName?.[0] ?? user.email?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => setAuthOpen(true)}
            >
              Sign in
            </Button>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
