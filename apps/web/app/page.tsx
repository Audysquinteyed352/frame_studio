"use client";

import React, { useState, useCallback } from "react";
import { Reveal } from "@/components/Reveal";
import { PromptBox } from "@/components/PromptBox";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ProgressScreen } from "@/components/ProgressScreen";
import { PreviewScreen } from "@/components/PreviewScreen";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [progressStage, setProgressStage] = useState("");
  const [queueInfo, setQueueInfo] = useState<{
    position?: number;
    isFirst?: boolean;
    active?: number;
    pending?: number;
  }>({});
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);

  const handleGenerate = async (prompt: string, model: string) => {
    setIsLoading(true);
    setProgressStage("Generating your video...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      const queuePositionHeader = res.headers.get("x-queue-position");
      const queueFirstHeader = res.headers.get("x-queue-first");
      const queueActiveHeader = res.headers.get("x-queue-active");
      const queuePendingHeader = res.headers.get("x-queue-pending");
      const queuePosition = queuePositionHeader ? Number(queuePositionHeader) : undefined;
      const queueFirst = queueFirstHeader === "true";
      const queueActive = queueActiveHeader ? Number(queueActiveHeader) : undefined;
      const queuePending = queuePendingHeader ? Number(queuePendingHeader) : undefined;

      const hasQueueInfo = queuePosition !== undefined && !Number.isNaN(queuePosition);
      if (hasQueueInfo) {
        setQueueInfo({
          position: queuePosition,
          isFirst: queueFirst,
          active: queueActive,
          pending: queuePending,
        });
        setProgressStage(queueFirst ? "Rendering your video..." : `Queued in line (${queuePosition})`);
      } else {
        setProgressStage("Downloading...");
      }

      if (!res.ok) {
        let errorMessage = `Server error (${res.status})`;
        const contentType = res.headers.get("Content-Type") || "";

        if (contentType.includes("application/json")) {
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // ignore invalid JSON
          }
        } else {
          try {
            const text = await res.text();
            if (text.includes("<!DOCTYPE") || text.includes("<html")) {
              errorMessage = `Server error (${res.status}). Check the server logs for details.`;
            } else if (text.trim()) {
              errorMessage = text;
            }
          } catch {
            // ignore text parse failures
          }
        }

        throw new Error(errorMessage);
      }

      const contentDisposition = res.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `frame-studio-${Date.now()}.mp4`;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      setIsLoading(false);
      setQueueInfo({});
      setProgressStage("");
      setPreview({ url, filename });

    } catch (err: any) {
      alert(err.message || "Failed to generate video");
      setIsLoading(false);
      setQueueInfo({});
      setProgressStage("");
    }
  };

  const handleClosePreview = useCallback(() => {
    if (preview) {
      window.URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  }, [preview]);

  return (
    <>
      <ApiKeyModal onApiKeySet={() => setApiKeySet(true)} />
      {isLoading && <ProgressScreen stage={progressStage} queueInfo={queueInfo} />}
      {preview && (
        <PreviewScreen
          videoUrl={preview.url}
          filename={preview.filename}
          onClose={handleClosePreview}
        />
      )}

      <div className="px-6 py-16 md:py-28 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] relative">
        <div className="w-full max-w-4xl mx-auto space-y-16 text-center">

          {/* Editorial Headline */}
          <div className="space-y-6 max-w-3xl mx-auto flex flex-col items-center">
            <Reveal delay={0.1}>
              <h1 className="text-6xl sm:text-8xl font-semibold tracking-[-0.02em] leading-[0.95]">
                <span 
                  className="bg-clip-text text-transparent animate-gradient-prominent"
                  style={{ 
                    WebkitBackgroundClip: "text", 
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% 100%",
                    backgroundImage: "linear-gradient(270deg, #ff2d55 0%, #ff9f0a 17%, #bf5af2 33%, #0071e3 50%, #34e0a4 67%, #ff2d55 100%)",
                  }}
                >
                  Motion graphics
                </span>
                <br/>
                <span className="font-serif italic font-semibold text-neutral-900">
                  from a prompt.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-lg sm:text-xl text-neutral-600 font-normal leading-relaxed max-w-2xl">
                Enterprise-grade video generation powered by Google Gemini. 
                Write a prompt, get production-ready MP4s in seconds.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex items-center gap-6 text-sm text-neutral-500 pt-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">No database</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Direct download</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">TypeScript validated</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Input Interface */}
          <Reveal delay={0.4}>
            <div className="w-full">
              <PromptBox onGenerate={handleGenerate} isLoading={isLoading} />
            </div>
          </Reveal>

        </div>
      </div>
    </>
  );
}