"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../contexts/AppContext";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/app/ui/button";

export default function PublicNav() {
  const { t } = useApp();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navItems = [
    { key: "/", label: t("nav.home") },
    { key: "/public/features", label: t("nav.features") },
    { key: "/public/pricing", label: t("nav.pricing") },
    { key: "/public/contact", label: t("nav.contact") },
  ];

  const navigate = (path) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top bar */}
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              Meetly
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
           {navItems.map((item) => {
              const isActive =
                pathname === item.key ||
                pathname.startsWith(item.key + "/");

              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm transition
                    ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            <Button
              variant="ghost"
              onClick={() => navigate("/auth/login")}
            >
              {t("nav.login")}
            </Button>

            <Button
              onClick={() => navigate("/auth/signup")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("nav.signup")}
            </Button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent transition"
            >
              {mobileMenuOpen
                ? <X className="w-6 h-6" />
                : <Menu className="w-6 h-6" />
              }
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">

             {navItems.map((item) => {
                const isActive =
                  pathname === item.key ||
                  pathname.startsWith(item.key + "/");

                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    className={`px-4 py-3 rounded-lg text-start transition
                      ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-accent hover:text-primary"
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <div className="pt-2 mt-2 border-t border-border space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/auth/login")}
                >
                  {t("nav.login")}
                </Button>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/auth/signup")}
                >
                  {t("nav.signup")}
                </Button>
              </div>

            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
