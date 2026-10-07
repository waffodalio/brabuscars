"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import Modal from "react-bootstrap/Modal";
import { useLanguage } from "@/context/LanguageContext";
import type { ListingImage } from "@/types/listing";

type Props = {
  images: ListingImage[];
  /** Index of the photo shown; `null` = closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Alt text of the photos (the listing title). */
  alt: string;
};

/** Horizontal distance (px) a finger must travel to change photo. */
const SWIPE_THRESHOLD = 50;

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full-size photo viewer over the dimmed page (react-bootstrap Modal: focus
 * trap, Escape and backdrop click close it). Previous / next with the
 * buttons, the keyboard arrows or a swipe; thumbnails to jump to a photo.
 */
export function ImageLightbox({ images, index, onIndexChange, onClose, alt }: Props) {
  const { t } = useLanguage();
  const touchStartX = useRef<number | null>(null);
  const open = index !== null && images.length > 0;
  const current = open ? Math.min(index, images.length - 1) : 0;
  const multiple = images.length > 1;

  const show = (delta: 1 | -1) =>
    onIndexChange((current + delta + images.length) % images.length);

  // Arrow keys while open (Escape is handled by the Modal).
  useEffect(() => {
    if (!open || !multiple) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onIndexChange((current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") onIndexChange((current + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, multiple, current, images.length, onIndexChange]);

  // Warm the cache for the neighbours so stepping through feels instant.
  useEffect(() => {
    if (!open || !multiple) return;
    for (const offset of [1, -1]) {
      const neighbour = images[(current + offset + images.length) % images.length];
      new Image().src = neighbour.url;
    }
  }, [open, multiple, current, images]);

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function onTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null || !multiple) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) show(dx < 0 ? 1 : -1);
  }

  const image = open ? images[current] : null;

  return (
    <Modal
      show={open}
      onHide={onClose}
      size="xl"
      centered
      className="chc-lightbox"
      backdropClassName="chc-lightbox-backdrop"
      aria-label={alt}
    >
      {image && (
        <>
          <div className="chc-lightbox__bar">
            <span className="chc-lightbox__counter" aria-live="polite">
              {t.lightbox.counter(current + 1, images.length)}
            </span>
            <button
              type="button"
              className="chc-lightbox__close"
              aria-label={t.lightbox.close}
              onClick={onClose}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.5 3.5l9 9m0-9-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            className="chc-lightbox__stage"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={image.id}
              src={image.url}
              alt={`${alt} — ${t.lightbox.counter(current + 1, images.length)}`}
              className="chc-lightbox__img"
            />
            {multiple && (
              <>
                <button
                  type="button"
                  className="chc-lightbox__nav chc-lightbox__nav--prev"
                  aria-label={t.common.prevPhoto}
                  onClick={() => show(-1)}
                >
                  <Chevron direction="prev" />
                </button>
                <button
                  type="button"
                  className="chc-lightbox__nav chc-lightbox__nav--next"
                  aria-label={t.common.nextPhoto}
                  onClick={() => show(1)}
                >
                  <Chevron direction="next" />
                </button>
              </>
            )}
          </div>

          {multiple && (
            <div className="chc-lightbox__thumbs">
              {images.map((thumb, i) => (
                <button
                  key={thumb.id}
                  type="button"
                  className={`chc-lightbox__thumb${i === current ? " active" : ""}`}
                  aria-label={t.lightbox.counter(i + 1, images.length)}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => onIndexChange(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb.thumbnailUrl} alt="" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
