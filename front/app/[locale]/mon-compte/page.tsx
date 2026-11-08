"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import { MyReservations } from "@/components/MyReservations";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Signed-in account page: profile summary and reservations. A forgotten
 * password is reset from the login page ("Forgot password?").
 */
export default function AccountPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { t, locale } = useLanguage();

  useEffect(() => {
    if (!initializing && !user) router.replace(`/${locale}/connexion`);
  }, [initializing, user, router, locale]);

  if (initializing || !user) {
    return (
      <Spinner animation="border" role="status" aria-label={t.common.loading} />
    );
  }

  return (
    <section className="chc-animate-in mx-auto" style={{ maxWidth: 680 }}>
      <h1 className="h3 mb-4">{t.account.title}</h1>

      <Card className="mb-4">
        <Card.Body className="p-4">
          <h2 className="h5 mb-3">{t.account.profile}</h2>
          <dl className="row mb-0">
            <dt className="col-sm-4 text-secondary fw-normal">{t.account.name}</dt>
            <dd className="col-sm-8">
              {user.firstName} {user.lastName}
            </dd>
            <dt className="col-sm-4 text-secondary fw-normal">{t.account.email}</dt>
            <dd className="col-sm-8 mb-0 text-break">{user.email}</dd>
          </dl>
        </Card.Body>
      </Card>

      <MyReservations />
    </section>
  );
}
