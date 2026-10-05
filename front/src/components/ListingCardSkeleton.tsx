import Card from "react-bootstrap/Card";

/** Pulsing placeholder shaped like {@link ListingCard}, shown while a grid loads. */
export function ListingCardSkeleton() {
  return (
    <Card className="h-100 overflow-hidden" aria-hidden="true">
      <div className="chc-media chc-skeleton" style={{ borderRadius: 0 }} />
      <Card.Body>
        <div className="chc-skeleton mb-2" style={{ height: "1.4rem", width: "45%" }} />
        <div className="chc-skeleton mb-2" style={{ height: "1rem", width: "70%" }} />
        <div className="chc-skeleton mb-3" style={{ height: "0.85rem", width: "50%" }} />
        <div className="d-flex gap-2">
          <div className="chc-skeleton" style={{ height: "1.5rem", width: "3.5rem", borderRadius: 999 }} />
          <div className="chc-skeleton" style={{ height: "1.5rem", width: "4.5rem", borderRadius: 999 }} />
          <div className="chc-skeleton" style={{ height: "1.5rem", width: "3rem", borderRadius: 999 }} />
        </div>
      </Card.Body>
    </Card>
  );
}
