"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useAuth } from "@/context/AuthContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import type { Brand } from "@/types/brand";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import type { Listing, ListingSort } from "@/types/listing";
import { FUEL_TYPES, TRANSMISSIONS } from "@/types/vehicle";
import { errorMessage } from "@/utils/errors";
import {
  EMPTY_FILTERS,
  hasInvalidRange,
  toQuery,
  type FilterForm,
} from "@/utils/listingFilters";

export default function ListingsPage() {
  const { isAdmin } = useAuth();
  const { t, withLocale } = useLanguage();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<FilterForm>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<FilterForm>({ ...EMPTY_FILTERS });
  const [rangeError, setRangeError] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    // Visitors never see the brand / model / category catalogue directly —
    // those endpoints are admin only. The public filter options are derived
    // from the published listings themselves.
    listingService
      .list({ status: "published" })
      .then((all) => {
        const brandMap = new Map<number, Brand>();
        const modelMap = new Map<number, CarModel>();
        const categoryMap = new Map<number, Category>();
        for (const listing of all) {
          if (listing.model?.brand) {
            brandMap.set(listing.model.brand.id, listing.model.brand);
          }
          if (listing.model) modelMap.set(listing.model.id, listing.model);
          if (listing.category) {
            categoryMap.set(listing.category.id, listing.category);
          }
        }
        const byName = (a: { name: string }, b: { name: string }) =>
          a.name.localeCompare(b.name, "fr");
        setBrands([...brandMap.values()].sort(byName));
        setModels([...modelMap.values()].sort(byName));
        setCategories([...categoryMap.values()].sort(byName));
      })
      .catch(() => {
        /* filters stay empty; the listing query still works */
      });
  }, []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    listingService
      .list(toQuery(applied))
      .then((data) => {
        if (!active) return;
        setListings(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(errorMessage(err, t.common.unknownError));
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [applied]);

  const visibleModels = useMemo(
    () =>
      form.brandId
        ? models.filter((model) => model.brandId === Number(form.brandId))
        : models,
    [models, form.brandId],
  );

  function set<K extends keyof FilterForm>(field: K, value: FilterForm[K]) {
    setRangeError(false);
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "brandId") next.modelId = "";
      return next;
    });
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(applied);
  const hasFilters =
    JSON.stringify(applied) !== JSON.stringify(EMPTY_FILTERS);

  function apply() {
    const invalid = hasInvalidRange(toQuery(form));
    setRangeError(invalid);
    if (invalid) return;
    setApplied({ ...form });
  }

  function reset() {
    setRangeError(false);
    setForm({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-4">
        <div>
          <h1 className="h3 mb-0">{t.listings.title}</h1>
          {status === "ready" && (
            <p className="text-secondary small mb-0">
              {t.listings.available(listings.length)}
            </p>
          )}
        </div>
        {isAdmin && (
          <Link
            href={withLocale("/admin/annonces")}
            className="btn btn-outline-secondary"
          >
            {t.listings.manage}
          </Link>
        )}
      </div>

      <Form
        className="chc-panel border rounded-3 p-3 mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <Row className="g-3">
          <Col xs={12} md={6} lg={4}>
            <Form.Label className="small mb-1">{t.listings.search}</Form.Label>
            <Form.Control
              value={form.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder={t.listings.searchPlaceholder}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">{t.listings.brand}</Form.Label>
            <Form.Select
              value={form.brandId}
              onChange={(e) => set("brandId", e.target.value)}
            >
              <option value="">{t.listings.brandAll}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">{t.listings.model}</Form.Label>
            <Form.Select
              value={form.modelId}
              onChange={(e) => set("modelId", e.target.value)}
            >
              <option value="">{t.listings.modelAll}</option>
              {visibleModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.category}
            </Form.Label>
            <Form.Select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">{t.listings.categoryAll}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.sortLabel}
            </Form.Label>
            <Form.Select
              value={form.sort}
              onChange={(e) => set("sort", e.target.value as ListingSort)}
            >
              {(Object.keys(t.listings.sort) as ListingSort[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {t.listings.sort[value]}
                  </option>
                ),
              )}
            </Form.Select>
          </Col>

          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">{t.listings.fuel}</Form.Label>
            <Form.Select
              value={form.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
            >
              <option value="">{t.listings.fuelAll}</option>
              {FUEL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t.vehicle.fuelType[value]}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.transmission}
            </Form.Label>
            <Form.Select
              value={form.transmission}
              onChange={(e) => set("transmission", e.target.value)}
            >
              <option value="">{t.listings.transmissionAll}</option>
              {TRANSMISSIONS.map((value) => (
                <option key={value} value={value}>
                  {t.vehicle.transmission[value]}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.minPrice}
            </Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.minPrice}
              onChange={(e) => set("minPrice", e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.maxPrice}
            </Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.maxPrice}
              onChange={(e) => set("maxPrice", e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.minYear}
            </Form.Label>
            <Form.Control
              type="number"
              value={form.minYear}
              onChange={(e) => set("minYear", e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.maxYear}
            </Form.Label>
            <Form.Control
              type="number"
              value={form.maxYear}
              onChange={(e) => set("maxYear", e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Form.Label className="small mb-1">
              {t.listings.maxMileage}
            </Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.maxMileage}
              onChange={(e) => set("maxMileage", e.target.value)}
            />
          </Col>
        </Row>

        <div className="d-flex gap-2 mt-3">
          <div className="position-relative d-inline-block">
            <Button type="submit" disabled={!dirty}>
              {t.listings.filter}
            </Button>
            {rangeError && (
              <div className="chc-tip-bubble" role="alert">
                {t.listings.invalidRange}
              </div>
            )}
          </div>
          {(hasFilters || dirty) && (
            <Button type="button" variant="outline-secondary" onClick={reset}>
              {t.listings.reset}
            </Button>
          )}
        </div>
      </Form>

      {status === "loading" && (
        <Row xs={1} sm={2} lg={3} className="g-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i}>
              <ListingCardSkeleton />
            </Col>
          ))}
        </Row>
      )}

      {status === "error" && (
        <ErrorAlert message={`${t.listings.loadErrorPrefix} ${error}`} />
      )}

      {status === "ready" && listings.length === 0 && (
        <Alert variant="light" className="border text-center py-5">
          {hasFilters ? t.listings.noneFiltered : t.listings.noneAtAll}
        </Alert>
      )}

      {status === "ready" && listings.length > 0 && (
        <Row xs={1} sm={2} lg={3} className="g-4 chc-stagger">
          {listings.map((listing) => (
            <Col key={listing.id}>
              <ListingCard listing={listing} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
