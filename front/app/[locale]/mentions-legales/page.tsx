import { LegalDocument } from "@/components/LegalDocument";

export default function Page() {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-9 col-xl-8">
        <LegalDocument kind="legalNotice" />
      </div>
    </div>
  );
}
