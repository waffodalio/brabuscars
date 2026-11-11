"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Photos chosen before the record exists (uploaded right after it is saved):
 * previews, the first one as cover, each removable. JPEG / PNG / WebP.
 */
export function PhotoPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  return (
    <div>
      <div className="chc-photo-grid">
        {previews.map((url, index) => (
          <figure key={url} className="chc-photo-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
            {index === 0 && <span className="chc-photo-cover">Couverture</span>}
            <button
              type="button"
              className="chc-photo-remove"
              aria-label={`Retirer la photo ${index + 1}`}
              onClick={() => onChange(files.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </figure>
        ))}
        <button type="button" className="chc-photo-add" onClick={() => input.current?.click()}>
          <span aria-hidden="true">+</span>
          {files.length === 0 ? "Ajouter les photos" : "Ajouter"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const added = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (added.length) onChange([...files, ...added]);
        }}
      />
      <div className="small text-secondary mt-2">
        JPEG, PNG ou WebP — 15 Mo max par photo. La première sert de couverture ; ces photos seront celles de
        l&apos;annonce.
      </div>
    </div>
  );
}
