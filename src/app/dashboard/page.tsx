"use client";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const handleLogout = () => {
    redirect("/logout");
  };

  return (
    <ProtectedRoute>
      <div className="flex justify-center items-center min-h-screen bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">Welcome! You are logged in.</p>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
