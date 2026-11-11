"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import {
  EMPTY_LISTING_FORM,
  ListingFormFields,
  toListingPayload,
  type ListingFormState,
} from "@/components/admin/ListingFormFields";
import { StockVehicleSummary } from "@/components/admin/StockVehicleSummary";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { carModelService } from "@/services/carModelService";
import { categoryService } from "@/services/categoryService";
import { listingService } from "@/services/listingService";
import { stockService } from "@/services/stockService";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import type { StockVehicle } from "@/types/stock";
import { errorMessage } from "@/utils/errors";
import { listingPath } from "@/utils/listingPath";
import { formatEuros } from "@/utils/saleLabels";
import { STOCK_STATUS_LABELS, STOCK_STATUS_VARIANTS, isInGarage, stockMatches } from "@/utils/stockLabels";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** The listing form, filled from the car: technical data copied, commercial data proposed. */
function formFromCar(car: StockVehicle): ListingFormState {
  return {
    ...EMPTY_LISTING_FORM,
    modelId: String(car.modelId),
    title: car.label,
    price: car.targetPrice !== null ? String(car.targetPrice) : "",
    year: String(car.year),
    mileage: String(car.mileage),
    fuelType: car.fuelType,
    transmission: car.transmission,
    power: car.power ? String(car.power) : "",
    doors: car.doors ? String(car.doors) : "",
    color: car.color ?? "",
    equipment: car.equipment,
    euroNorm: car.euroNorm ?? "",
    co2: car.co2 !== null ? String(car.co2) : "",
    hasCarPass: car.hasCarPass,
  };
}

/**
 * Back-office: new listing, always made from a garage-register car.
 * Step 1 — pick the car (cards + search), or enter a new one first.
 * Step 2 — only the commercial side: title, price, category, description,
 * equipment, warranty, photos; the technical data come from the car.
 */
export default function NewListingPage() {
  const router = useRouter();
  const { withLocale } = useLanguage();

  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  /** Cars at the garage that have no listing yet (null while loading). */
  const [cars, setCars] = useState<StockVehicle[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [car, setCar] = useState<StockVehicle | null>(null);
  const [form, setForm] = useState<ListingFormState>({ ...EMPTY_LISTING_FORM });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    Promise.all([carModelService.list(), categoryService.list(), stockService.list()])
      .then(([modelList, categoryList, stock]) => {
        setModels(modelList);
        setCategories(categoryList);
        const free = stock.filter((item) => !item.listing && isInGarage(item.status));
        setCars(free);
        // From a car page or right after entering a car: ?stock=<id>
        const wanted = Number(new URLSearchParams(window.location.search).get("stock"));
        const preselected = free.find((item) => item.id === wanted);
        if (preselected) choose(preselected);
      })
      .catch((err: unknown) => {
        setLoadError(errorMessage(err, "Erreur inconnue"));
        setCars([]);
      });
  }, []);

  function choose(next: StockVehicle) {
    setCar(next);
    setForm(formFromCar(next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function set<K extends keyof ListingFormState>(field: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    if (!car) return;
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
      // Photos: the car's (shown on its listing), nothing to upload here.
      const listing = await listingService.create({ ...payload, stockVehicleId: car.id });
      router.push(withLocale(listingPath(listing)));
    } catch (err) {
      setError(errorMessage(err, "Enregistrement impossible"));
      setSubmitting(false);
      setProgress("");
    }
  }

  if (cars === null) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  /* Step 1 — which car is put on sale? */
  if (!car) {
    const shown = cars.filter((item) => stockMatches(item, search));
    return (
      <section style={{ maxWidth: 1080 }}>
        <h1 className="h4 mb-1">Nouvelle annonce</h1>
        <p className="text-secondary mb-4">
          Choisissez le véhicule du stock à mettre en vente : ses caractéristiques seront reprises telles quelles.
        </p>
        <ErrorAlert message={loadError} />

        <Form.Control
          type="search"
          className="chc-car-search mb-4"
          placeholder="Rechercher : marque, modèle, VIN, n° de stock…"
          aria-label="Rechercher un véhicule du stock"
          value={search}
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="chc-car-grid chc-stagger">
          <Link href={withLocale("/admin/stock/nouveau")} className="chc-car-card chc-car-card--new">
            <span className="chc-car-card-plus" aria-hidden="true">
              +
            </span>
            <strong>Entrer un nouveau véhicule</strong>
            <span className="small text-secondary">Pas encore au stock ? Enregistrez-le, puis créez l&apos;annonce.</span>
          </Link>

          {shown.map((item) => (
            <button key={item.id} type="button" className="chc-car-card" onClick={() => choose(item)}>
              <span className="chc-car-card-photo">
                {item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0].thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span className="small text-secondary">Sans photo</span>
                )}
              </span>
              <span className="d-flex align-items-center justify-content-between gap-2 w-100">
                <span className="small text-secondary">{item.reference}</span>
                <span className={`badge text-bg-${STOCK_STATUS_VARIANTS[item.status]}`}>{STOCK_STATUS_LABELS[item.status]}</span>
              </span>
              <strong className="chc-car-card-title">{item.label}</strong>
              <span className="chc-vehicle-summary-facts">
                <span>{item.year}</span>
                <span>{item.mileage.toLocaleString("fr-BE")} km</span>
                <span>{FUEL_TYPE_LABELS[item.fuelType]}</span>
                <span>{TRANSMISSION_LABELS[item.transmission]}</span>
              </span>
              <span className="d-flex align-items-end justify-content-between gap-2 w-100 mt-auto pt-2">
                <span className="small text-secondary text-truncate">{item.location ?? ""}</span>
                <span className="fw-bold chc-num">{item.targetPrice !== null ? formatEuros(item.targetPrice) : ""}</span>
              </span>
            </button>
          ))}
        </div>

        {cars.length === 0 ? (
          <Alert variant="light" className="border mt-4">
            Aucun véhicule du stock n&apos;attend d&apos;annonce. Entrez d&apos;abord le véhicule au stock.
          </Alert>
        ) : (
          shown.length === 0 && (
            <Alert variant="light" className="border mt-4">
              Aucun véhicule ne correspond à « {search.trim()} ».
            </Alert>
          )
        )}
      </section>
    );
  }

  /* Step 2 — the commercial side of the listing */
  return (
    <section style={{ maxWidth: 800 }}>
      <h1 className="h4 mb-4">Nouvelle annonce</h1>

      <StockVehicleSummary vehicle={car} onChange={() => setCar(null)} />
      {car.images.length === 0 && (
        <Alert variant="warning" className="mt-3 mb-0">
          Ce véhicule n&apos;a pas encore de photo : l&apos;annonce s&apos;afficherait sans image.{" "}
          <Link href={withLocale(`/admin/stock/${car.id}`)}>Ajouter les photos au véhicule →</Link>
        </Alert>
      )}

      <Form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <ErrorAlert message={error} />

        <Card className="mb-2">
          <Card.Body className="p-3 p-md-4">
            <ListingFormFields form={form} models={models} categories={categories} onChange={set} lockTechnical />

          </Card.Body>
        </Card>

        <div className="d-flex align-items-center gap-3 mt-4">
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Créer l&apos;annonce
          </Button>
          {progress && <span className="small text-secondary">{progress}</span>}
        </div>
        <p className="small text-secondary mt-2 mb-0">
          L&apos;annonce est créée en brouillon et liée au véhicule {car.reference} ; elle affiche ses photos. Publiez-la
          depuis sa page.
        </p>
      </Form>
    </section>
  );
}
