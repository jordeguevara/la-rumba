"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { user } = useAuth();

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    onOpenChange(false);
  }

  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Your Account</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {user.displayName?.[0] ?? user.email?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold text-foreground">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full border-border"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            Join La Rumba
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-muted-foreground text-sm text-center">
            Sign in to submit events, mark yourself as going, and connect with
            other dancers.
          </p>
          <Button
            className="w-full gradient-pink border-0 text-white font-semibold h-12 rounded-xl"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
