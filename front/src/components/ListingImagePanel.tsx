"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { listingImageService } from "@/services/listingImageService";
import type { ListingImage } from "@/types/listing";
import { errorMessage } from "@/utils/errors";

interface ListingImagePanelProps {
  listingId: number;
  images: ListingImage[];
  canManage: boolean;
  /** Called with the fresh list after any change. */
  onChange: (images: ListingImage[]) => void;
}

/**
 * Admin gallery editor for a listing: upload (JPEG/PNG/WebP, re-encoded
 * server-side), set the cover, delete. When `canManage` is false it is a
 * plain read-only gallery.
 */
export function ListingImagePanel({
  listingId,
  images,
  canManage,
  onChange,
}: ListingImagePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    onChange(await listingImageService.list(listingId));
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
        await listingImageService.upload(listingId, file);
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
      <h2 className="h5">Photos</h2>

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
                          run(() =>
                            listingImageService.update(listingId, image.id, {
                              isCover: true,
                            }),
                          )
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
                        run(() =>
                          listingImageService.remove(listingId, image.id),
                        )
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
        <div className="mt-3 d-flex align-items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFiles}
          />
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
          <span className="small text-secondary">
            JPEG, PNG ou WebP — 15 Mo max
          </span>
        </div>
      )}
    </section>
  );
}
