"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function PendingVerificationPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="max-w-md w-full p-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Your account has been set as inactive
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground ">
            <p className="text-center">
              Please contact your admin to reactivate your account.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
