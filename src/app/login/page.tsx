"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Github, Chrome } from "lucide-react"; // Add Github icon
import { redirect } from "next/navigation";
import { useRef, useState } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false); // Add this line
  const resetInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      redirect("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSent(false);
    setResetLoading(true); // Start loading
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    setResetLoading(false); // End loading
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full h-full max-h-md max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to Trainee Tracker!
          </CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {!showForgot ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label className="mb-2" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-center items-center gap-y-6">
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label className="mb-2" htmlFor="reset-email">
                  Enter your email to reset password
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  ref={resetInputRef}
                  disabled={resetLoading} // Disable input while loading
                />
              </div>
              {resetError && (
                <p className="text-sm text-red-600">{resetError}</p>
              )}
              {resetSent && (
                <p className="text-sm text-green-600">
                  Password reset email sent! Please check your inbox.
                </p>
              )}
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 text-xs"
                  onClick={() => setShowForgot(false)}
                  disabled={resetLoading} // Disable while loading
                >
                  Back to login
                </Button>
                <Button type="submit" className="w-32" disabled={resetLoading}>
                  {resetLoading ? "Sending..." : "Send Reset Email"}
                </Button>
              </div>
            </form>
          )}
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          {/* Google Sign In */}
          <Button
            onClick={() => handleLogin("google")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          {/* GitHub Sign In */}
          <Button
            onClick={() => handleLogin("github")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <div className="text-center text-sm">
            Don&amp;t have an account?
            <Button
              variant="link"
              onClick={() => redirect("/register?method=email")}
            >
              Create one
            </Button>
            {/* <Button
              type="button"
              variant={"link"}
              onClick={() => {
                setShowForgot(true);
                setTimeout(() => resetInputRef.current?.focus(), 100);
              }}
            >
              Forgot password?
            </Button> */}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
