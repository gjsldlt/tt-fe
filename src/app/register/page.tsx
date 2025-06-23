"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
      } else {
        router.replace("/login");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("member").insert({
      firstname: form.firstname,
      lastname: form.lastname,
      email: email,
      role: "member",
      active: true,
      auth_user_id: userId,
    });

    if (error) {
      console.error("Registration error:", error);
      alert("There was an error. Please try again.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">Complete Your Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="firstname">First Name</Label>
          <Input
            id="firstname"
            value={form.firstname}
            onChange={(e) => setForm({ ...form, firstname: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastname">Last Name</Label>
          <Input
            id="lastname"
            value={form.lastname}
            onChange={(e) => setForm({ ...form, lastname: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <Button type="submit" className="w-full">
          Register
        </Button>
        <Button
          onClick={() => redirect("/login")}
          className="w-full"
          variant="outline"
        >
          Logout
        </Button>
      </form>
    </div>
  );
}
