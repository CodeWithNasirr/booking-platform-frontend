"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Check, Loader2 } from "lucide-react";

import { Card } from "@/app/ui/card";
import { Button } from "@/app/ui/button";
import { Progress } from "@/app/ui/progress";
import { useApp } from "@/contexts/AppContext";

export default function PublishingPage() {
  const router = useRouter();
  const token = Cookies.get("access_token");

  const { t, isRTL, activeTenant } = useApp();
  const TenantID = activeTenant;

  const PHASES = [
    {
      id: 1,
      title: t("publishing.phase1.title"),
      subtitle: t("publishing.phase1.subtitle"),
    },
    {
      id: 2,
      title: t("publishing.phase2.title"),
      subtitle: t("publishing.phase2.subtitle"),
    },
    {
      id: 3,
      title: t("publishing.phase3.title"),
      subtitle: t("publishing.phase3.subtitle"),
    },
    {
      id: 4,
      title: t("publishing.phase4.title"),
      subtitle: t("publishing.phase4.subtitle"),
    },
  ];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [domainInfo, setDomainInfo] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");

  const progress = isDone
    ? 100
    : ((phaseIndex + 1) / PHASES.length) * 100;

  useEffect(() => {
    if (phaseIndex < PHASES.length - 1) {
      const tmr = setTimeout(() => {
        setPhaseIndex((prev) => prev + 1);
      }, 1100);
      return () => clearTimeout(tmr);
    } else {
      const tmr = setTimeout(() => {
        completeOnboarding();
      }, 1300);
      return () => clearTimeout(tmr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex]);

  async function completeOnboarding() {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding/complete/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant": TenantID,
            ...(token && { Authorization: `Bearer ${token}`, credentials: "include" }),
          },
        }
      );

      const json = await res.json();

      if (json.domain) {
        setDomainInfo(json.domain);
        setWebsiteUrl(buildFrontendUrl(json.domain));
      }

      setIsDone(true);
    } catch (err) {
      console.error("Complete onboarding failed:", err);
      setIsDone(true);
    } finally {
      setIsCompleting(false);
    }
  }

  function buildFrontendUrl(domain) {
    if (!domain) return "";

    if (process.env.NODE_ENV === "development") {
      if (domain.type === "subdomain") {
        return `http://${domain.value}.lvh.me:3000`;
      }
      return `http://${domain.value}:3000`;
    }

    return `https://${domain.full_domain}`;
  }

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleCopyLink = async () => {
    if (!websiteUrl) return;
    try {
      await navigator.clipboard.writeText(websiteUrl);
      alert(t("publishing.linkCopied"));
    } catch {
      alert(t("publishing.copyFailed"));
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 ${
        isRTL ? "rtl" : ""
      }`}
    >
      <div className="w-full max-w-3xl">
        {!isDone ? (
          <Card className="p-10 rounded-3xl shadow-xl border-0 bg-white">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-2">
                <span className="text-3xl">📦</span>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {t("publishing.title")}
                </h1>
                <p className="text-slate-500 mt-2 max-w-xl mx-auto">
                  {t("publishing.subtitle")}
                </p>
              </div>

              <div className="w-full mt-2">
                <Progress value={progress} className="h-2 rounded-full" />
                <p className="text-xs text-slate-400 mt-2">
                  {t("publishing.keepOpen")}
                </p>
              </div>

              <div className="w-full mt-4 space-y-3">
                {PHASES.map((phase, idx) => {
                  const isActive = idx === phaseIndex;
                  const isCompleted = idx < phaseIndex;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3
                        ${
                          isCompleted
                            ? "border-emerald-100 bg-emerald-50"
                            : isActive
                            ? "border-orange-200 bg-orange-50"
                            : "border-slate-100 bg-slate-50"
                        } ${isRTL ? "flex-row-reverse text-right" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {phase.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {phase.subtitle}
                        </p>
                      </div>

                      <div className="ml-4">
                        {isCompleted ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                        ) : (
                          <div className="w-7 h-7 rounded-full border border-slate-200" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-10 rounded-3xl shadow-xl border-0 bg-white text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {t("publishing.successTitle")}
              </h1>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">
                {t("publishing.successSubtitle")}
              </p>
            </div>

            {websiteUrl && (
              <div className="mx-auto max-w-xl">
                <div
                  className={`flex flex-col md:flex-row items-stretch gap-2 md:gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 ${
                    isRTL ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline truncate"
                  >
                    {websiteUrl}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={handleCopyLink}
                  >
                    {t("common.copyLink")}
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Button
                className="px-8 h-11 rounded-xl text-white bg-slate-900 hover:bg-slate-800"
                onClick={handleGoToDashboard}
              >
                {t("publishing.goDashboard")}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
