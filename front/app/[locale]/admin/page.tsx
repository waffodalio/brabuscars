"use client";

import Link from "next/link";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const SECTIONS = [
  { href: "/admin/marques", title: "Marques", text: "Constructeurs automobiles." },
  { href: "/admin/modeles", title: "Modèles", text: "Modèles rattachés à une marque." },
  { href: "/admin/categories", title: "Catégories", text: "Types de carrosserie / segments." },
  { href: "/admin/annonces", title: "Annonces", text: "Créez les annonces, gérez les photos et la publication." },
  { href: "/admin/messages", title: "Messages", text: "Demandes reçues via le formulaire de contact." },
];

const SUPER_ADMIN_SECTIONS = [
  {
    href: "/admin/utilisateurs",
    title: "Utilisateurs",
    text: "Comptes et attribution du rôle administrateur.",
  },
];

export default function AdminDashboardPage() {
  const { isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const sections = isSuperAdmin
    ? [...SECTIONS, ...SUPER_ADMIN_SECTIONS]
    : SECTIONS;

  return (
    <Row xs={1} md={2} lg={3} className="g-3">
      {sections.map((section) => (
        <Col key={section.href}>
          <Link
            href={withLocale(section.href)}
            className="text-decoration-none text-reset"
          >
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="h6">{section.title}</Card.Title>
                <Card.Text className="text-secondary small mb-0">
                  {section.text}
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  );
}
