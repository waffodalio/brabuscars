"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { listingImageService } from "@/services/listingImageService";
import type { ListingImage } from "@/types/listing";
import { errorMessage } from "@/utils/errors";
import { IMAGE_ACCEPT } from "@/utils/imageUpload";

/** Where the gallery lives: a listing's photos, or a garage-register car's. */
export interface ImageGalleryApi {
  list: () => Promise<ListingImage[]>;
  upload: (file: File) => Promise<unknown>;
  update: (imageId: number, input: { isCover?: boolean }) => Promise<unknown>;
  remove: (imageId: number) => Promise<unknown>;
}

/** The gallery of a listing (`/listings/:id/images`). */
export function listingGallery(listingId: number): ImageGalleryApi {
  return {
    list: () => listingImageService.list(listingId),
    upload: (file) => listingImageService.upload(listingId, file),
    update: (imageId, input) => listingImageService.update(listingId, imageId, input),
    remove: (imageId) => listingImageService.remove(listingId, imageId),
  };
}

interface ListingImagePanelProps {
  /** A listing's gallery… */
  listingId?: number;
  /** …or any other one (a stock car's photos). */
  api?: ImageGalleryApi;
  /** Section title (default « Photos »). */
  title?: string;
  images: ListingImage[];
  canManage: boolean;
  /** Called with the fresh list after any change. */
  onChange: (images: ListingImage[]) => void;
}

/**
 * Admin gallery editor for a listing: upload (JPEG/PNG/WebP/HEIC, re-encoded
 * server-side), set the cover, delete. When `canManage` is false it is a
 * plain read-only gallery.
 */
export function ListingImagePanel({
  listingId,
  api: givenApi,
  title = "Photos",
  images,
  canManage,
  onChange,
}: ListingImagePanelProps) {
  const api = givenApi ?? listingGallery(listingId ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    onChange(await api.list());
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Action impossible"));
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setBusy(true);
    setError("");
    try {
      for (const file of files) {
        await api.upload(file);
      }
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Envoi impossible"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4">
      {title && <h2 className="h5">{title}</h2>}

      <ErrorAlert message={error} />

      {images.length === 0 ? (
        <p className="text-secondary">Aucune photo.</p>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {images.map((image) => (
            <figure key={image.id} className="mb-0" style={{ width: 180 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl}
                alt=""
                loading="lazy"
                className="rounded border w-100"
                style={{ height: 120, objectFit: "cover" }}
              />
              <figcaption className="small mt-1 d-flex flex-wrap align-items-center gap-2">
                {image.isCover && <Badge bg="primary">Couverture</Badge>}
                {canManage && (
                  <>
                    {!image.isCover && (
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0"
                        disabled={busy}
                        onClick={() =>
                          run(() => api.update(image.id, { isCover: true }))
                        }
                      >
                        Couverture
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="link"
                      className="p-0 text-danger"
                      disabled={busy}
                      onClick={() =>
                        run(() => api.remove(image.id))
                      }
                    >
                      Supprimer
                    </Button>
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {canManage && (
        <div className="mt-3 d-flex flex-wrap justify-content-end align-items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            hidden
            onChange={handleFiles}
          />
          <span className="small text-secondary">
            JPEG, PNG, WebP ou HEIC (iPhone) — 15 Mo max
          </span>
          <Button
            variant="outline-primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy && (
              <Spinner
                as="span"
                size="sm"
                animation="border"
                className="me-2"
              />
            )}
            Ajouter des photos
          </Button>
        </div>
      )}
    </section>
  );
}
