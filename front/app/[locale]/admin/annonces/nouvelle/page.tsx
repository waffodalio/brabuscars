"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import {
  EMPTY_LISTING_FORM,
  ListingFormFields,
  toListingPayload,
  type ListingFormState,
} from "@/components/admin/ListingFormFields";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { carModelService } from "@/services/carModelService";
import { categoryService } from "@/services/categoryService";
import { listingImageService } from "@/services/listingImageService";
import { listingService } from "@/services/listingService";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import { errorMessage } from "@/utils/errors";

export default function NewListingPage() {
  const router = useRouter();
  const { withLocale } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);

  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<ListingFormState>({ ...EMPTY_LISTING_FORM });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    Promise.all([carModelService.list(), categoryService.list()])
      .then(([modelList, categoryList]) => {
        setModels(modelList);
        setCategories(categoryList);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setLoadError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, []);

  function set(field: keyof ListingFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  async function submit() {
    setError("");
    let payload;
    try {
      payload = toListingPayload(form);
    } catch (err) {
      setError(errorMessage(err, "Formulaire incomplet"));
      return;
    }

    setSubmitting(true);
    try {
      const listing = await listingService.create(payload);

      for (let i = 0; i < files.length; i += 1) {
        setProgress(`Envoi des photos… ${i + 1}/${files.length}`);
        await listingImageService.upload(listing.id, files[i]);
      }

      router.push(withLocale(`/annonces/${listing.id}`));
    } catch (err) {
      setError(errorMessage(err, "Enregistrement impossible"));
      setSubmitting(false);
      setProgress("");
    }
  }

  if (status === "loading") {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }
  if (status === "error") {
    return <ErrorAlert message={loadError} />;
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Nouvelle annonce</h1>
        <Link
          href={withLocale("/admin/annonces")}
          className="btn btn-sm btn-outline-secondary"
        >
          Retour
        </Link>
      </div>

      {models.length === 0 && (
        <Alert variant="warning">
          Créez au moins une marque et un modèle avant d&apos;ajouter une
          annonce.
        </Alert>
      )}

      <Form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <ErrorAlert message={error} />

        <ListingFormFields
          form={form}
          models={models}
          categories={categories}
          onChange={set}
        />

        <Form.Group className="mt-3" controlId="listing-images">
          <Form.Label>Photos</Form.Label>
          <Form.Control
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onFiles}
          />
          <Form.Text className="text-secondary">
            JPEG, PNG ou WebP — 15 Mo max par fichier. La première photo servira
            de couverture ; vous pourrez la changer ensuite.
          </Form.Text>
          {files.length > 0 && (
            <div className="small mt-1">{files.length} fichier(s) sélectionné(s)</div>
          )}
        </Form.Group>

        <div className="d-flex align-items-center gap-3 mt-4">
          <Button type="submit" disabled={submitting || models.length === 0}>
            {submitting && (
              <Spinner as="span" size="sm" animation="border" className="me-2" />
            )}
            Créer l&apos;annonce
          </Button>
          {progress && <span className="small text-secondary">{progress}</span>}
        </div>
        <p className="small text-secondary mt-2 mb-0">
          L&apos;annonce est créée en brouillon. Publiez-la depuis sa page une
          fois les photos vérifiées.
        </p>
      </Form>
    </section>
  );
}
