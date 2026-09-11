// app/auth/reset-password/page.js
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/password/reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "This reset link is invalid or has expired.");
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid reset link</h1>
          <p className="text-sm text-gray-500">
            This link is missing its token. Please request a new password reset.
          </p>
          <Link href="/auth/forgot-password" className="inline-block mt-6 text-sm font-medium text-gray-700 hover:text-gray-900 underline">
            Request a new link
          </Link>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password reset</h1>
          <p className="text-sm text-gray-500">
            Your password has been changed. Redirecting you to sign in…
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-gray-700" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Choose a new password</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Enter and confirm your new password.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to sign in</Link>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">{children}</div>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<Shell><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div></Shell>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
