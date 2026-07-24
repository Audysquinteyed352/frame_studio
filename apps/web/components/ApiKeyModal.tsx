"use client";

import React, { useState, useEffect } from "react";

interface ApiKeyModalProps {
  onApiKeySet: (apiKey: string) => void;
}

export function ApiKeyModal({ onApiKeySet }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkExistingApiKey();
  }, []);

  const checkExistingApiKey = async () => {
    try {
      const res = await fetch("/api/apikey");
      let data: any = {};
      try {
        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        }
      } catch (e) {
        // ignore malformed/empty JSON
        data = {};
      }

      if (data.hasApiKey) {
        setShowModal(false);
      } else {
        setShowModal(true);
      }
    } catch (err) {
      setShowModal(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      let data: any = {};
      try {
        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        }
      } catch (e) {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || `Failed to save API key (status ${res.status})`);
      }

      onApiKeySet(apiKey.trim());
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking) {
    return null;
  }

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">API Key Required</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Frame Studio requires a Google Gemini API key to generate videos. Your key is stored securely in your browser and never shared.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700 mb-2">
                Gemini API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition"
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                Get your free API key from{" "}
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-900 underline hover:text-neutral-700"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!apiKey.trim() || isSaving}
              className="w-full px-6 py-3 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSaving ? "Saving..." : "Save API Key"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
