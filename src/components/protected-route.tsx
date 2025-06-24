"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isUnverified, setIsUnverified] = useState<boolean>(false);
  const [isInactive, setIsInactive] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async (response: { data: { session: Session | null } }) => {
        const { data } = response;
        if (!data.session) {
          router.replace("/login");
        } else {
          // Check member role
          const userId = data.session.user.id;
          const { data: member, error } = await supabase
            .from("member")
            .select("role, active")
            .eq("auth_user_id", userId)
            .single();

          if (error || !member) {
            router.replace("/login");
            return;
          }
          setIsInactive(!member.active);

          if (member.role === "unverified") {
            setIsUnverified(true);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
          }
        }
      })
      .catch((error) => {
        console.error("Error checking session:", error);
        router.replace("/login");
      });
  }, []);

  if (isAuthenticated === null) {
    return <div className="text-center mt-10">Checking session...</div>;
  }

  if (isUnverified) {
    router.replace("/pending-verification");
    return null;
  }

  if (isInactive) {
    router.replace("/inactive-account");
    return null;
  }

  return <>{children}</>;
}
