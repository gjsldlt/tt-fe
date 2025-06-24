"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (collapsed) {
    return (
      <div className="flex items-center justify-between ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Theme menu"
              className="mx-auto"
            >
              {theme === "light" ? (
                <Sun className="text-yellow-500" size={18} />
              ) : theme === "dark" ? (
                <Moon className="text-blue-400" size={18} />
              ) : (
                <Laptop2 className="text-green-500" size={18} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2" size={18} />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2" size={18} />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop2 className="mr-2" size={18} />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        aria-label="Light mode"
      >
        <Sun className={theme === "light" ? "text-yellow-500" : ""} size={18} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
      >
        <Moon className={theme === "dark" ? "text-blue-400" : ""} size={18} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <Laptop2
          className={theme === "system" ? "text-green-500" : ""}
          size={18}
        />
      </Button>
    </div>
  );
}
