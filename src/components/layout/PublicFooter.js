"use client";

import { useApp } from "@/contexts/AppContext";
import { useTranslation } from "@/lib/t";

export default function PublicFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm">
            © {year} {t("landing.footer.copy")}
          </p>
        </div>
      </div>
    </footer>
  );
}