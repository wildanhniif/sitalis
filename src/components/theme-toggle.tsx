"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDark(document.documentElement.classList.contains("dark")), 0);
    return () => clearTimeout(timer);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ceksitasi:theme", next ? "dark" : "light");
  };
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}>{dark ? <Sun /> : <Moon />}</Button>;
}
