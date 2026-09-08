"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { vehicleImageService } from "@/services/vehicleImageService";
import type { VehicleImage } from "@/types/vehicle";

interface VehicleImagePanelProps {
  vehicleId: number;
  canManage: boolean;
}

/**
 * Displays a vehicle's image gallery. When `canManage` is set (the caller
 * sells the vehicle), it also offers add / set-cover / delete controls.
 */
export function VehicleImagePanel({
  vehicleId,
  canManage,
}: VehicleImagePanelProps) {
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    vehicleImageService
      .list(vehicleId)
      .then(setImages)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue"),
      );
  }, [vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    await run(async () => {
      await vehicleImageService.add(vehicleId, {
        url: value,
        isCover: images.length === 0,
      });
      setUrl("");
    });
  }

  return (
    <section className="mt-4">
      <h2 className="h5">Photos</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {images.length === 0 ? (
        <p className="text-secondary">Aucune photo.</p>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {images.map((image) => (
            <figure key={image.id} className="mb-0" style={{ width: 180 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="rounded border w-100"
                style={{ height: 120, objectFit: "cover" }}
              />
              <figcaption className="small mt-1 d-flex align-items-center gap-2">
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
                            vehicleImageService.update(vehicleId, image.id, {
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
                          vehicleImageService.remove(vehicleId, image.id),
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
        <Form onSubmit={handleAdd} className="mt-3" style={{ maxWidth: 480 }}>
          <InputGroup>
            <Form.Control
              type="url"
              placeholder="https://…/photo.jpg"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <Button type="submit" disabled={busy || !url.trim()}>
              Ajouter
            </Button>
          </InputGroup>
        </Form>
      )}
    </section>
  );
}
