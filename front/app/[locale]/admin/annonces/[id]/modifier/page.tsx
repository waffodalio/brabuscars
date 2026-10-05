"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import {
  ListingFormFields,
  toListingPayload,
  type ListingFormState,
} from "@/components/admin/ListingFormFields";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { carModelService } from "@/services/carModelService";
import { categoryService } from "@/services/categoryService";
import { listingService } from "@/services/listingService";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import type { Listing } from "@/types/listing";
import { errorMessage } from "@/utils/errors";

function formOf(listing: Listing): ListingFormState {
  return {
    modelId: String(listing.modelId),
    categoryId: listing.categoryId ? String(listing.categoryId) : "",
    title: listing.title,
    description: listing.description ?? "",
    price: String(listing.price),
    year: String(listing.year),
    mileage: String(listing.mileage),
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    power: listing.power ? String(listing.power) : "",
    doors: listing.doors ? String(listing.doors) : "",
    color: listing.color ?? "",
  };
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { withLocale } = useLanguage();

  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ListingFormState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      listingService.getById(id),
      carModelService.list(),
      categoryService.list(),
    ])
      .then(([listing, modelList, categoryList]) => {
        setForm(formOf(listing));
        setModels(modelList);
        setCategories(categoryList);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setLoadError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, [id]);

  function set(field: keyof ListingFormState, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function submit() {
    if (!form) return;
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
      await listingService.update(id, payload);
      router.push(withLocale(`/annonces/${id}`));
    } catch (err) {
      setError(errorMessage(err, "Enregistrement impossible"));
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }
  if (status === "error" || !form) {
    return <ErrorAlert message={loadError || "Annonce introuvable"} />;
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Modifier l&apos;annonce</h1>
        <div className="d-flex gap-2">
          <Link
            href={withLocale(`/annonces/${id}`)}
            className="btn btn-sm btn-outline-primary"
          >
            Photos &amp; publication
          </Link>
          <Link
            href={withLocale("/admin/annonces")}
            className="btn btn-sm btn-outline-secondary"
          >
            Retour
          </Link>
        </div>
      </div>

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

        <div className="mt-4">
          <Button type="submit" disabled={submitting}>
            {submitting && (
              <Spinner as="span" size="sm" animation="border" className="me-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </Form>
    </section>
  );
}
