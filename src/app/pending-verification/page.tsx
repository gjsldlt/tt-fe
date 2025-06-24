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
            Your account is pending verification
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground ">
            <p className="text-center">
              Please wait for an admin to approve your account.
            </p>
            <p className="text-center">
              You will be notified once your account is verified.
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
