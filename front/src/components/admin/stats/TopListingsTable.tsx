"use client";

import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import { useLanguage } from "@/context/LanguageContext";
import type { TopListing } from "@/types/analytics";
import { LISTING_STATUS_LABELS, LISTING_STATUS_VARIANTS, formatPrice } from "@/utils/listingLabels";
import { AdminIcon } from "../AdminIcon";
import { formatNumber } from "./format";

const PENCIL = "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z";
const HEART =
  "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z";

/** Most viewed listings with their audience, favourites and a link to edit them. */
export function TopListingsTable({ rows }: { rows: TopListing[] }) {
  const { withLocale } = useLanguage();
  if (rows.length === 0) {
    return <p className="text-secondary small mb-0">Aucune fiche annonce consultée sur la période.</p>;
  }
  const max = Math.max(...rows.map((row) => row.views));

  return (
    <Table responsive hover className="mb-0 align-middle chc-stats-table">
      <thead>
        <tr>
          <th scope="col" className="text-secondary fw-medium small d-none d-sm-table-cell">#</th>
          <th scope="col" className="text-secondary fw-medium small chc-col-title">Annonce</th>
          <th scope="col" className="text-secondary fw-medium small text-end text-md-start chc-col-views">Vues</th>
          <th scope="col" className="text-secondary fw-medium small text-end d-none d-md-table-cell">Visiteurs</th>
          <th scope="col" className="text-secondary fw-medium small text-end">Favoris</th>
          <th scope="col"><span className="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.listingId}>
            <td className="text-secondary small chc-num d-none d-sm-table-cell">{index + 1}</td>
            <td className="chc-col-title">
              <div className="d-flex align-items-center gap-3">
                <div className="chc-stats-thumb d-none d-sm-block">
                  {row.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.thumbnailUrl} alt="" loading="lazy" />
                  )}
                </div>
                <div className="chc-stats-title">
                  <Link href={withLocale(`/annonces/${row.listingId}`)} className="fw-semibold text-reset d-block text-truncate">
                    {row.title}
                  </Link>
                  <div className="small text-secondary text-truncate">
                    {row.brand} {row.model} · {formatPrice(row.price)}
                    {row.status !== "published" && (
                      <Badge bg={LISTING_STATUS_VARIANTS[row.status]} className="ms-2">
                        {LISTING_STATUS_LABELS[row.status]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </td>
            <td className="chc-col-views">
              <div className="d-flex align-items-center justify-content-end gap-2">
                <div className="chc-bar-track flex-grow-1 mt-0 d-none d-md-block" aria-hidden="true">
                  <div className="chc-bar-fill" style={{ width: `${(row.views / max) * 100}%` }} />
                </div>
                <span className="fw-semibold chc-num">{formatNumber(row.views)}</span>
              </div>
            </td>
            <td className="text-end chc-num d-none d-md-table-cell">{formatNumber(row.visitors)}</td>
            <td className="text-end chc-num text-nowrap">
              <span className="text-secondary me-1"><AdminIcon d={HEART} size={13} /></span>
              {formatNumber(row.favorites)}
            </td>
            <td className="text-end">
              <Link
                href={withLocale(`/admin/annonces/${row.listingId}/modifier`)}
                className="btn btn-sm btn-outline-secondary text-nowrap"
                aria-label={`Modifier « ${row.title} »`}
              >
                <AdminIcon d={PENCIL} size={14} />
                <span className="d-none d-lg-inline ms-1">Modifier</span>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
