"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
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
import { stockService } from "@/services/stockService";
import type { StockVehicle } from "@/types/stock";
import { StockVehicleSummary } from "@/components/admin/StockVehicleSummary";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import type { Listing } from "@/types/listing";
import { listingPath } from "@/utils/listingPath";
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
    equipment: listing.equipment ?? [],
    euroNorm: listing.euroNorm ?? "",
    co2: listing.co2 !== null ? String(listing.co2) : "",
    hasCarPass: listing.hasCarPass,
    warranty: listing.warrantyMonths !== null,
    warrantyMonths: String(listing.warrantyMonths ?? 12),
    warrantyKind: listing.warrantyKind ?? "dealer",
    warrantyCoverage: listing.warrantyCoverage ?? [],
    warrantyCustom: listing.warrantyCustom ?? [],
    warrantyNotes: listing.warrantyNotes ?? "",
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
  /** The garage-register car of this listing, if any: the technical reference. */
  const [car, setCar] = useState<StockVehicle | null>(null);
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
      stockService.list().catch(() => []),
    ])
      .then(([listing, modelList, categoryList, stock]) => {
        const linked = stock.find((item) => item.listing?.id === listing.id) ?? null;
        setCar(linked);
        // Linked: the technical fields are the car's (saving then re-aligns an older listing).
        setForm(
          linked
            ? {
                ...formOf(listing),
                modelId: String(linked.modelId),
                year: String(linked.year),
                mileage: String(Math.max(linked.mileage, listing.mileage)),
                fuelType: linked.fuelType,
                transmission: linked.transmission,
                power: linked.power ? String(linked.power) : "",
                doors: linked.doors ? String(linked.doors) : "",
                color: linked.color ?? "",
                equipment: linked.equipment,
                euroNorm: linked.euroNorm ?? "",
                co2: linked.co2 !== null ? String(linked.co2) : "",
                hasCarPass: linked.hasCarPass,
              }
            : formOf(listing),
        );
        setModels(modelList);
        setCategories(categoryList);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setLoadError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, [id]);

  function set<K extends keyof ListingFormState>(field: K, value: ListingFormState[K]) {
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
      const updated = await listingService.update(id, payload);
      router.push(withLocale(listingPath(updated)));
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
    <section style={{ maxWidth: 800 }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h4 mb-0">Modifier l&apos;annonce</h1>
        <div className="d-flex gap-2">
          <Link
            href={withLocale(form ? listingPath({ id, title: form.title }) : `/annonces/${id}`)}
            className="btn btn-sm btn-outline-primary"
          >
            Photos &amp; publication
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

        {car && (
          <div className="mb-4">
            <StockVehicleSummary vehicle={car} />
          </div>
        )}

        <Card className="mb-2">
          <Card.Body className="p-3 p-md-4">
            <ListingFormFields
              form={form}
              models={models}
              categories={categories}
              onChange={set}
              lockTechnical={car !== null}
            />
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end mt-4">
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
