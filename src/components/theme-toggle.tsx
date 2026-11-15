"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setDark(document.documentElement.classList.contains("dark"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggle = () => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    const next = !isCurrentlyDark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sitalis:theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sitalis:theme", "light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      title={dark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
    >
      {mounted ? (dark ? <Sun className="size-4" /> : <Moon className="size-4" />) : <span className="size-4" />}
    </Button>
  );
}
