"use client";

import { useState } from "react";
import { X, Upload, ImagePlus, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  uploadServiceImage,
  uploadServiceGallery,
  deleteServiceGalleryImage,
} from "@/lib/serviceMediaApi";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY = 8;

// Client-side pre-check (the server validates authoritatively, including real
// image content). Returns an error translation key, or null when OK.
function preCheck(file) {
  if (file.size > MAX_BYTES) return "advanced.imageTooLarge";
  if (file.type && !ALLOWED.includes(file.type)) return "advanced.invalidType";
  return null;
}

/**
 * Real file upload for a service's main image + gallery. Uploads go straight to
 * the backend (which stores the object on R2 and returns a canonical URL); for a
 * not-yet-saved service the files are held locally and uploaded by the parent
 * after create (see `getPendingUploads`). Never accepts a URL.
 *
 * Props: slug (string|null), tenantId, form, setForm.
 * form holds: image (display url), imageFile (pending File), gallery [{key,url}],
 * galleryFiles (pending File[]).
 */
export function ServiceMediaManager({ slug, tenantId, form, setForm }) {
  const { t } = useApp();
  const [imgBusy, setImgBusy] = useState(false);
  const [galBusy, setGalBusy] = useState(false);
  const [error, setError] = useState("");

  const gallery = form.gallery || [];
  const galleryFiles = form.galleryFiles || [];
  const imagePreview = form.imagePreview || form.image || "";

  const pickImage = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const bad = preCheck(file);
    if (bad) return setError(t(bad));

    if (!slug) {
      // New service: defer upload until it's created. Preview locally.
      const preview = URL.createObjectURL(file);
      setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
      return;
    }
    setImgBusy(true);
    try {
      const media = await uploadServiceImage(slug, file, tenantId);
      setForm((f) => ({
        ...f,
        image: media?.url || "",
        imageFile: null,
        imagePreview: "",
      }));
    } catch (err) {
      setError(err?.detail || t("advanced.uploadError"));
    } finally {
      setImgBusy(false);
    }
  };

  const removeImage = () =>
    setForm((f) => ({ ...f, imageFile: null, imagePreview: "" }));

  const pickGallery = async (e) => {
    setError("");
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const current = gallery.length + galleryFiles.length;
    if (current + files.length > MAX_GALLERY) {
      return setError(t("advanced.maxGallery").replace("{max}", String(MAX_GALLERY)));
    }
    for (const f of files) {
      const bad = preCheck(f);
      if (bad) return setError(t(bad));
    }

    if (!slug) {
      const withPreview = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setForm((f) => ({ ...f, galleryFiles: [...(f.galleryFiles || []), ...withPreview] }));
      return;
    }
    setGalBusy(true);
    try {
      const updated = await uploadServiceGallery(slug, files, tenantId);
      setForm((f) => ({ ...f, gallery: updated }));
    } catch (err) {
      setError(err?.detail || t("advanced.uploadError"));
    } finally {
      setGalBusy(false);
    }
  };

  const removeGalleryItem = async (key) => {
    if (!slug) return;
    setError("");
    try {
      const updated = await deleteServiceGalleryImage(slug, key, tenantId);
      setForm((f) => ({ ...f, gallery: updated }));
    } catch (err) {
      setError(err?.detail || t("advanced.uploadError"));
    }
  };

  const removePendingGallery = (idx) =>
    setForm((f) => ({
      ...f,
      galleryFiles: (f.galleryFiles || []).filter((_, i) => i !== idx),
    }));

  return (
    <div className="space-y-5">
      {/* ── Main image ─────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("advanced.image")}
        </label>
        <p className="text-xs text-gray-500 mb-2">{t("advanced.imageHint")}</p>

        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-xl border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="w-7 h-7 text-gray-300" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50 w-fit">
              {imgBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {imgBusy
                  ? t("advanced.uploading")
                  : imagePreview
                    ? t("advanced.replaceImage")
                    : t("advanced.uploadImage")}
              </span>
              <input
                type="file"
                accept={ALLOWED.join(",")}
                className="hidden"
                disabled={imgBusy}
                onChange={pickImage}
              />
            </label>

            {form.imageFile && (
              <button
                type="button"
                onClick={removeImage}
                className="text-xs text-red-500 hover:text-red-700 w-fit"
              >
                {t("advanced.removeImage")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Gallery ────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("advanced.gallery")}
        </label>
        <p className="text-xs text-gray-500 mb-2">{t("advanced.galleryHint")}</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {gallery.map((item) => (
            <div key={item.key || item.url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="w-full h-24 object-cover rounded-lg border"
              />
              {item.key && (
                <button
                  type="button"
                  onClick={() => removeGalleryItem(item.key)}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:text-red-700 shadow"
                  aria-label={t("advanced.removeImage")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {galleryFiles.map((g, idx) => (
            <div key={g.preview} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.preview}
                alt=""
                className="w-full h-24 object-cover rounded-lg border opacity-70"
              />
              <button
                type="button"
                onClick={() => removePendingGallery(idx)}
                className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:text-red-700 shadow"
                aria-label={t("advanced.removeImage")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <label className="h-24 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer hover:bg-gray-50 text-xs">
            {galBusy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
            <span>{galBusy ? t("advanced.uploading") : t("advanced.addGallery")}</span>
            <input
              type="file"
              accept={ALLOWED.join(",")}
              multiple
              className="hidden"
              disabled={galBusy}
              onChange={pickGallery}
            />
          </label>
        </div>
      </div>

      {!slug && (
        <p className="text-xs text-amber-600">{t("advanced.saveFirst")}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * After a brand-new service is created, upload any files the user picked while
 * it had no slug yet. Returns nothing; callers refetch the service afterwards.
 */
export async function flushPendingServiceMedia(slug, form, tenantId) {
  if (!slug) return;
  if (form?.imageFile) {
    try {
      await uploadServiceImage(slug, form.imageFile, tenantId);
    } catch {
      /* non-fatal: the service is already saved */
    }
  }
  const pending = (form?.galleryFiles || []).map((g) => g.file).filter(Boolean);
  if (pending.length) {
    try {
      await uploadServiceGallery(slug, pending, tenantId);
    } catch {
      /* non-fatal */
    }
  }
}
