"use client";

import Link from "next/link";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  { href: "/admin/marques", title: "Marques", text: "Constructeurs automobiles." },
  { href: "/admin/modeles", title: "Modèles", text: "Modèles rattachés à une marque." },
  { href: "/admin/categories", title: "Catégories", text: "Types de carrosserie / segments." },
  { href: "/admin/vehicules", title: "Véhicules", text: "Fiches véhicule et galeries photos." },
  { href: "/admin/annonces", title: "Annonces", text: "Mises en vente et cycle de publication." },
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
  const sections = isSuperAdmin
    ? [...SECTIONS, ...SUPER_ADMIN_SECTIONS]
    : SECTIONS;

  return (
    <Row xs={1} md={2} lg={3} className="g-3">
      {sections.map((section) => (
        <Col key={section.href}>
          <Link href={section.href} className="text-decoration-none text-reset">
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
