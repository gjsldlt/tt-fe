"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then((response: { data: { session: any } }) => {
      const { data } = response;
      if (!data.session) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, []);

  if (isAuthenticated === null) {
    return <div className="text-center mt-10">Checking session...</div>;
  }

  return <>{children}</>;
}
