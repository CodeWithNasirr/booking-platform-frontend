"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function PlatformInviteAcceptPage() {
  const { token } = useParams();

  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API =
    process.env.NEXT_PUBLIC_API_URL || "https://yourplatform.com";

  useEffect(() => {
    fetch(`${API}/api/v1/platform/invite/check/${token}/`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setInviteData(data);
        else setError(data.detail);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `${API}/api/v1/platform/invite/accept/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }
    );

    const data = await res.json();

    if (res.ok) {

        // ✅ Save cookies for ALL subdomains
        Cookies.set("access_token", data.access, {
        domain: ".lvh.me",
        path: "/",
        sameSite: "lax",
        });

        Cookies.set("refresh_token", data.refresh, {
        domain: ".lvh.me",
        path: "/",
        sameSite: "lax",
        });

        // ✅ Small delay so middleware sees cookies
        setTimeout(() => {
        window.location.replace(data.redirect_to || "/superadmin");
        }, 150);

    } else {
        setError(data.detail || "Something went wrong");
    }
    };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading invitation...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Join Platform Team
        </h1>

        <p className="text-gray-500 mb-6">
          Setting up account for <b>{inviteData.email}</b>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#8B1E3F] outline-none"
          />

          <button
            type="submit"
            className="w-full bg-[#8B1E3F] hover:bg-[#6B1631] text-white py-3 rounded-lg font-medium transition"
          >
            Activate Account
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Invitation expires automatically for security reasons.
        </p>
      </div>
    </div>
  );
}
