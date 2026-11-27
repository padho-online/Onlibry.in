// src/seo/CanonicalX.jsx
// CanonicalX V1.0 — Onlibry SEO Engine

import { useLocation } from "react-router-dom";

const DOMAIN = "https://onlibry.in";

const PUBLIC_ROUTES = new Set([
  "/",
  "/pricing",
  "/files",
  "/folders",
  "/mock-tests",
  "/quizzes",
  "/blog",
  "/exam-updates",
  "/notifications",
  "/info"
]);

export default function CanonicalX() {
  const { pathname } = useLocation();

  // Normalize trailing slash
  const path = pathname.replace(/\/+$/, "") || "/";

  // Only approved public routes
  if (!PUBLIC_ROUTES.has(path)) {
    return null;
  }

  const canonicalURL = `${DOMAIN}${path}`;

  return (
    <link rel="canonical" href={canonicalURL} />
  );
}