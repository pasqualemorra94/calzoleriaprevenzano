/**
 * FootCamera — Camera capture and image upload for foot photos.
 *
 * Optimized for tablet use in-store:
 * - Access device camera directly
 * - Overlay guide for proper foot photo
 * - Fallback to file upload
 * - Preview before submission
 */

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
import { Camera, Upload, RotateCcw, Check, Loader2 } from "lucide-react";

interface FootCameraProps {
  onCapture: (base64Image: string) => void;
  disabled?: boolean;
}

export function FootCamera({ onCapture, disabled }: FootCameraProps) {
  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on tablet
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMode("camera");
      }
    } catch (err) {
      // Camera not available — fall back to file upload
      fileInputRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    setImageSrc(dataUrl);
    setMode("preview");
  }, [stopCamera]);

  const retake = useCallback(() => {
    setImageSrc(null);
    setMode("idle");
  }, []);

  const confirmCapture = useCallback(() => {
    if (!imageSrc) return;
    onCapture(imageSrc);
  }, [imageSrc, onCapture]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB limit

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageSrc(dataUrl);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // Camera mode
  if (mode === "camera") {
    return (
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/* Camera overlay guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 rounded-full border-2 border-dashed border-white/50" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-black/50 p-4">
          <button
            type="button"
            onClick={capturePhoto}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <div className="h-12 w-12 rounded-full border-2 border-gray-300" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => { stopCamera(); setMode("idle"); }}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
        >
          ✕
        </button>
      </div>
    );
  }

  // Preview mode
  if (mode === "preview" && imageSrc) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl">
          <img
            src={imageSrc}
            alt="Anteprima piede"
            className="h-64 w-full object-contain bg-gray-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={retake}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Ripeti
          </button>
          <button
            type="button"
            onClick={confirmCapture}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Conferma
          </button>
        </div>
      </div>
    );
  }

  // Idle mode — camera + upload buttons
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
        dragOver ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-200 bg-gray-50"
      }`}
    >
      <p className="mb-4 text-center text-sm text-gray-500">
        Fotografa il piede su uno sfondo chiaro, dall'alto
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          <Camera className="h-4 w-4" />
          Scatta Foto
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" />
          Carica
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
