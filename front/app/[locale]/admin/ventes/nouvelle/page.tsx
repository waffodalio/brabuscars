"use client";

import { useRouter } from "next/navigation";
import { SaleForm } from "@/components/admin/SaleForm";
import { useLanguage } from "@/context/LanguageContext";
import { saleService } from "@/services/saleService";

/** Back-office: new sale file (draft). */
export default function NewSalePage() {
  const router = useRouter();
  const { withLocale } = useLanguage();

  return (
    <section style={{ maxWidth: 960 }}>
      <h1 className="h4 mb-4">Nouveau dossier de vente</h1>
      <SaleForm
        submitLabel="Créer le dossier"
        onSubmit={async (input) => {
          const sale = await saleService.create(input);
          router.replace(withLocale(`/admin/ventes/${sale.id}`));
        }}
      />
    </section>
  );
}
