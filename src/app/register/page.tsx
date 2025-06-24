"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEmailSignup = searchParams.get("method") === "email";

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

  const [error, setError] = useState("");

  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | ""
  >("");

  // Password strength checker function
  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return "weak";
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[!@#$%^&*]/.test(pwd))
      return "medium";
    return "strong";
  };

  useEffect(() => {
    if (!isEmailSignup) {
      supabase.auth.getUser().then(({ data }) => {
        const user = data.user;
        if (user) {
          setUserId(user.id);
          setEmail(user.email || "");
        } else {
          router.replace("/login");
        }
      });
    }
  }, [isEmailSignup]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email method: sign up & insert Member after confirmation
    if (isEmailSignup) {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) return setError(signupError.message);

      // Store additional profile data after signup confirmed
      const user = data.user;
      if (user) {
        const { error: memberError } = await supabase.from("member").insert({
          email,
          firstname,
          lastname,
          role: "unverified",
          active: true,
          auth_user_id: user.id,
        });

        if (memberError) setError(memberError.message);
        else router.push("/dashboard");
      }
    } else {
      // OAuth method: just insert Member
      const { error: insertError } = await supabase.from("member").insert({
        email,
        firstname,
        lastname,
        role: "unverified",
        active: true,
        auth_user_id: userId,
      });

      if (insertError) setError(insertError.message);
      else router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold text-center">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        {isEmailSignup && (
          <>
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordStrength(checkPasswordStrength(e.target.value));
                }}
                required
              />
              {password && (
                <p
                  className={
                    passwordStrength === "strong"
                      ? "text-green-600 text-xs mt-1"
                      : passwordStrength === "medium"
                      ? "text-yellow-600 text-xs mt-1"
                      : "text-red-600 text-xs mt-1"
                  }
                >
                  Password strength: {passwordStrength}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <Label className="mb-2" htmlFor="firstname">
            First Name
          </Label>
          <Input
            id="firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="mb-2" htmlFor="lastname">
            Last Name
          </Label>
          <Input
            id="lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">
          Register
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => redirect("/login")}
          className="w-full"
        >
          Cancel
        </Button>
      </form>
    </div>
  );
}
