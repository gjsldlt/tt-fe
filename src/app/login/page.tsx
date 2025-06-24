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
import { Chrome } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full h-full max-h-md max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to Tao Tracker!
          </CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator></Separator>
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
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
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

          <div className="text-center text-sm">
            Don’t have an account?
            <Button
              variant="link"
              onClick={() => redirect("/register?method=email")}
            >
              Create one
            </Button>
          </div>

          {/* GitHub Sign In */}
          {/* <Button
            onClick={() => handleLogin("github")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button> */}

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
