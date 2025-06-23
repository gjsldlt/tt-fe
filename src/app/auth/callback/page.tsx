"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Callback() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { user } = session;

      // Check Member table for this user
      const { data: member, error } = await supabase
        .from("member")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (member) {
        router.replace("/dashboard");
      } else {
        router.replace("/register");
      }
    };

    handleAuthRedirect();
  }, []);

  return <p className="text-center mt-10">Checking your account...</p>;
}
