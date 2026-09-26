"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, CheckCircle2 } from "lucide-react";

export default function AdminPagesCMS() {
  const [content, setContent] = useState<any>({
    homeHeroTitle: "PURE CEYLON TEA",
    homeHeroSubtitle: "THE TASTE OF CEYLON",
    homeHeroDescription: "Discover the authentic taste, aroma and character of Ceylon Tea from Sri Lanka.",
    heroButton1: "SHOP TEA",
    heroButton2: "EXPLORE CEYLON TEA",
    aboutStory: "Born from an unwavering dedication to authentic Sri Lankan tea culture, LEENA CEYLON brings uncompromised single-origin purity directly from misty hill country plantations to connoisseurs worldwide.",
    ceylonTeaSummary: "Since 1867, Sri Lanka has produced the world's most celebrated orthodox teas. Explore the agro-climatic elevations, regional signatures, and grading terminology that make Ceylon Tea truly irreplaceable.",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setContent((prev: any) => ({ ...prev, ...data.settings }));
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setNotice("Content changes saved successfully.");
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-tea-border">
        <div>
          <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
            Content Management (CMS)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
            Website Pages & Copy
          </h1>
          <p className="text-xs text-tea-muted mt-0.5">
            Modify customer-facing copy without editing application code
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? "SAVING..." : "SAVE CMS CHANGES"}
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Homepage Hero Copy */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border">
          Homepage Hero Content
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Hero Main Tagline
            </label>
            <input
              type="text"
              value={content.homeHeroTitle || ""}
              onChange={(e) => setContent({ ...content, homeHeroTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Hero Secondary Tagline
            </label>
            <input
              type="text"
              value={content.homeHeroSubtitle || ""}
              onChange={(e) => setContent({ ...content, homeHeroSubtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Hero Body Text
            </label>
            <textarea
              rows={2}
              value={content.homeHeroDescription || ""}
              onChange={(e) => setContent({ ...content, homeHeroDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>
        </div>
      </div>

      {/* About Us & Ceylon Tea Copy */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-tea-border shadow-subtle space-y-4">
        <h3 className="font-serif text-base font-bold text-tea-dark pb-3 border-b border-tea-border">
          Brand Story & Educational Copy
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              About Us Story Statement
            </label>
            <textarea
              rows={4}
              value={content.aboutStory || ""}
              onChange={(e) => setContent({ ...content, aboutStory: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Ceylon Tea Heritage Introduction
            </label>
            <textarea
              rows={4}
              value={content.ceylonTeaSummary || ""}
              onChange={(e) => setContent({ ...content, ceylonTeaSummary: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
