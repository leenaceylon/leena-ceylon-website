"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
} from "lucide-react";

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/media/upload");
      const data = await res.json();
      if (data.media) setMedia(data.media);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLogo = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLogo) setLogoUploading(true);
    else setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (isLogo) formData.append("isLogo", "true");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      showNotice(
        isLogo
          ? "Official LEENA CEYLON logo updated successfully."
          : "Image uploaded successfully."
      );
      loadMedia();
    } catch (err: any) {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image file?")) return;
    try {
      const res = await fetch(`/api/media/upload?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotice("Image removed from library.");
        loadMedia();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
          Digital Asset Management
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Media Library & Brand Assets
        </h1>
        <p className="text-xs text-tea-muted mt-0.5">
          Store tea pack mockups, plantation photography, and maintain official brand assets
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Official Brand Logo Management Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-tea-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tea-forest" />
              <h3 className="font-serif text-base font-bold text-tea-dark">
                Official LEENA CEYLON Logo
              </h3>
            </div>
            <p className="text-xs text-tea-muted max-w-xl">
              <strong>Brand Rule:</strong> The official LEENA CEYLON logo is the single source of truth across desktop, mobile header, footer, favicon, and admin dashboard. Do NOT change proportions or alter design.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-border bg-tea-surface hover:bg-tea-bg text-xs font-semibold text-tea-dark transition self-start sm:self-auto">
            <Upload className="w-3.5 h-3.5 text-tea-forest" />
            <span>{logoUploading ? "Updating..." : "Upload New Official Logo"}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleFileUpload(e, true)}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <div className="relative h-16 w-56 p-2 rounded-xl bg-tea-surface border border-tea-border">
            <Image
              src="/brand/logo.png"
              alt="Official LEENA CEYLON Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-xs text-tea-muted space-y-0.5">
            <p className="font-bold text-tea-dark">Active Logo Path: /brand/logo.png</p>
            <p>Used natively across all customer and administrative surfaces.</p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-tea-surface p-8 rounded-3xl border-2 border-dashed border-tea-border hover:border-tea-leaf transition text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-white border border-tea-border flex items-center justify-center text-tea-forest shadow-sm">
          <Upload className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-sm text-tea-dark">
            Upload Product Images or Photography
          </h4>
          <p className="text-xs text-tea-muted">
            PNG, JPEG, WebP, or SVG up to 5 MB per file
          </p>
        </div>

        <label className="inline-block cursor-pointer px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm">
          <span>{uploading ? "Uploading..." : "Select File"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, false)}
            className="hidden"
          />
        </label>
      </div>

      {/* Gallery Grid */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-tea-dark">
          Uploaded Images ({media.length})
        </h3>

        {loading ? (
          <div className="p-8 text-xs text-tea-muted">Loading media catalog...</div>
        ) : media.length === 0 ? (
          <div className="p-8 text-center text-xs text-tea-muted bg-white rounded-2xl border border-tea-border">
            No media uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-tea-border overflow-hidden shadow-subtle hover:shadow-card transition flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-tea-surface">
                  <Image
                    src={item.url}
                    alt={item.originalName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-3 space-y-2">
                  <p className="font-medium text-tea-dark text-xs truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="text-[10px] text-tea-muted">
                    {(item.size / 1024).toFixed(0)} KB
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-tea-border/60">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.id, item.url)}
                      className="text-[11px] font-semibold text-tea-forest hover:text-tea-dark flex items-center gap-1"
                      title="Copy relative URL"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === item.id ? "Copied!" : "Copy URL"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-tea-muted hover:text-rose-600 transition"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
