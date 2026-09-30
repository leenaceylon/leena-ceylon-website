"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  FolderOpen,
  ArrowUpDown,
} from "lucide-react";

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState<Record<string, number>>({});

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

  const showNotice = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };

  // Upload a fresh file to public/uploads or public/brand
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
          ? "Official LEENA CEYLON logo saved directly to local disk (public/brand/logo.png)."
          : `Image saved automatically to your local folder (${data.localFilePath || "public/uploads/"}).`
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

  // Replace / update an existing image file on disk
  const handleReplaceImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdatingId(id);
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update image file.");
        return;
      }

      // Bust client image cache so the newly replaced image shows immediately
      setCacheBuster((prev) => ({ ...prev, [id]: Date.now() }));

      showNotice(
        `Local file updated & automatically overwritten on disk (${data.localFilePath || "public/uploads/"})!`
      );
      loadMedia();
    } catch (err: any) {
      console.error(err);
      alert("Failed to replace image file.");
    } finally {
      setUpdatingId(null);
      e.target.value = "";
    }
  };

  // Synchronize local disk files in public/uploads and public/brand with database
  const handleSyncDisk = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/media/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || "Failed to sync local files.", "error");
        return;
      }

      showNotice(data.message || "Local disk files successfully synchronized!", "info");
      loadMedia();
    } catch (err: any) {
      console.error(err);
      showNotice("Failed to sync files from disk.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image file? This permanently removes it from your local disk and database.")) return;
    try {
      const res = await fetch(`/api/media/upload?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotice("Image removed from library and local disk.");
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
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Digital Asset Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Media Library & Local File Storage
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Every image uploaded or updated is automatically saved directly as a physical local file in your project folder
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync Local Files Button */}
          <button
            type="button"
            onClick={handleSyncDisk}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-forest/30 bg-tea-surface hover:bg-tea-leaf/10 text-xs font-bold text-tea-forest transition shadow-sm disabled:opacity-50"
            title="Scan public/uploads and public/brand folders on disk and sync newly added files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Scanning Disk..." : "Sync Local Files from Disk"}</span>
          </button>

          {/* Upload New Image Button */}
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Saving Local File..." : "Upload from Computer"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, false)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm animate-fade-in border ${
            notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : notice.type === "info"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              notice.type === "error"
                ? "text-rose-600"
                : notice.type === "info"
                ? "text-blue-600"
                : "text-emerald-600"
            }`}
          />
          <span className="font-medium">{notice.message}</span>
        </div>
      )}

      {/* Local File Storage Info Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <span>Automatic Local File Save Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-300">
                100% Local Disk
              </span>
            </h4>
            <p className="text-amber-900/90 leading-relaxed">
              Every image uploaded or updated in this library is physically written to your PC folder{" "}
              <code className="px-1.5 py-0.5 bg-amber-100/90 font-mono text-[11px] rounded border border-amber-300 text-amber-950 font-bold">
                public/uploads/
              </code>{" "}
              (or <code className="px-1.5 py-0.5 bg-amber-100/90 font-mono text-[11px] rounded border border-amber-300 text-amber-950 font-bold">public/brand/</code>).
              You can also copy images directly into that folder on your computer and click <strong>&quot;Sync Local Files from Disk&quot;</strong> to detect them automatically.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncDisk}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-amber-950 text-xs font-bold transition flex items-center gap-1.5 border border-amber-300"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Check Local Folders</span>
          </button>
        </div>
      </div>

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
              <strong>Brand Rule:</strong> The official LEENA CEYLON logo is the single source of truth across desktop, mobile header, footer, favicon, and admin dashboard.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tea-border bg-tea-surface hover:bg-tea-bg text-xs font-semibold text-tea-dark transition self-start sm:self-auto">
            <Upload className="w-3.5 h-3.5 text-tea-forest" />
            <span>{logoUploading ? "Updating Local Logo..." : "Upload & Replace Logo File"}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleFileUpload(e, true)}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
          <div className="relative h-16 w-56 p-2 rounded-xl bg-tea-surface border border-tea-border">
            <Image
              src="/brand/logo.png"
              alt="Official LEENA CEYLON Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-xs text-tea-muted space-y-1">
            <p className="font-bold text-tea-dark">
              Local File Path: <span className="font-mono text-tea-forest">public/brand/logo.png</span>
            </p>
            <p>Saved physically on local disk. Used natively across all customer and administrative surfaces.</p>
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
            PNG, JPEG, WebP, or SVG up to 5 MB per file &bull; Automatically saved to local disk
          </p>
        </div>

        <label className="inline-block cursor-pointer px-5 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm">
          <span>{uploading ? "Saving to Local Folder..." : "Select File from Computer"}</span>
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
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-tea-dark flex items-center gap-2">
            <span>Media Library Images ({media.length})</span>
          </h3>
          <span className="text-xs text-tea-muted">
            Click &quot;Update / Replace&quot; on any image to overwrite it with a new file from your computer
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-xs text-tea-muted text-center bg-white rounded-2xl border border-tea-border">
            Loading media catalog...
          </div>
        ) : media.length === 0 ? (
          <div className="p-8 text-center text-xs text-tea-muted bg-white rounded-2xl border border-tea-border">
            No media uploaded yet. Click &quot;Upload from Computer&quot; or &quot;Sync Local Files&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => {
              const buster = cacheBuster[item.id];
              const imageUrl = buster ? `${item.url}?v=${buster}` : item.url;
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-tea-border overflow-hidden shadow-subtle hover:shadow-card transition flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-tea-surface">
                    <Image
                      src={imageUrl}
                      alt={item.originalName || item.filename}
                      fill
                      className="object-cover"
                    />
                    {isUpdating && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-tea-dark text-xs font-bold z-10">
                        <RefreshCw className="w-5 h-5 animate-spin text-tea-forest" />
                        <span>Updating local file...</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <p className="font-bold text-tea-dark text-xs truncate" title={item.originalName || item.filename}>
                        {item.originalName || item.filename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-tea-muted mt-0.5">
                        <span>{(item.size / 1024).toFixed(0)} KB</span>
                        <span className="uppercase text-[9px] font-semibold bg-tea-surface px-1.5 py-0.5 rounded border border-tea-border">
                          {item.mimeType?.replace("image/", "") || "IMG"}
                        </span>
                      </div>
                    </div>

                    {/* Local Physical File Location Badge */}
                    <div className="bg-tea-surface/80 rounded-lg p-1.5 border border-tea-border/60 space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-tea-muted font-semibold">
                        <HardDrive className="w-3 h-3 text-tea-forest" />
                        <span>Local Disk File:</span>
                      </div>
                      <p className="font-mono text-[10px] text-tea-forest truncate select-all" title={`public${item.url}`}>
                        public{item.url}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="space-y-1.5 pt-1 border-t border-tea-border/60">
                      {/* Replace / Update File from Computer Button */}
                      <label className="cursor-pointer w-full py-1.5 px-2.5 rounded-lg border border-tea-border bg-tea-surface hover:bg-tea-leaf/10 text-tea-dark text-[11px] font-bold flex items-center justify-center gap-1.5 transition">
                        <ArrowUpDown className="w-3 h-3 text-tea-forest" />
                        <span>Update / Replace File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReplaceImage(item.id, e)}
                          className="hidden"
                          disabled={isUpdating}
                        />
                      </label>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.id, item.url)}
                          className="text-[11px] font-semibold text-tea-forest hover:text-tea-dark flex items-center gap-1"
                          title="Copy image URL"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === item.id ? "Copied!" : "Copy URL"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-tea-muted hover:text-rose-600 transition"
                          title="Delete from local disk & database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
