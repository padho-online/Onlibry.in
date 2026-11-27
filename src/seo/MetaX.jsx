// src/seo/MetaX.jsx
// MetaX V1.0 — Onlibry SEO Engine

import { useLocation } from "react-router-dom";

const DOMAIN = "https://onlibry.in";

const DEFAULT_META = {
  title: "Onlibry - Learn Anytime, Anywhere",
  description:
    "Access educational resources, previous year question papers, mock tests, quizzes and exam updates.",
  image: `${DOMAIN}/assets/logo.png`
};

const PAGE_META = {
  "/": {
    title: "Study Materials, Mock Tests & Exam Updates | Onlibry",
    description:
      "Prepare for competitive and university exams with study materials, previous year papers, mock tests, quizzes and latest exam updates."
  },

  "/files": {
    title: "Previous Year Question Papers & Study Materials | Onlibry",
    description:
      "Explore previous year question papers, books, notes and educational resources for university and competitive examinations."
  },

  "/folders": {
    title: "Educational Resource Library | Onlibry",
    description:
      "Browse organized folders containing academic resources, question papers and study materials."
  },

  "/mock-tests": {
    title: "Online Mock Tests for Competitive Exams | Onlibry",
    description:
      "Practice online mock tests for ICET, CUET, CPGET and other competitive examinations."
  },

  "/quizzes": {
    title: "Online Practice Quizzes | Onlibry",
    description:
      "Improve your exam preparation with interactive quizzes and practice questions."
  },

  "/blog": {
    title: "Education News & Latest Exam Updates | Onlibry",
    description:
      "Read the latest education news, recruitment notifications, examination updates and preparation guides."
  },

  "/exam-updates": {
    title: "Latest University Exam Notifications | Onlibry",
    description:
      "Find university examination notifications, timetables, registration updates and important announcements."
  },

  "/notifications": {
    title: "Latest Education Notifications | Onlibry",
    description:
      "Stay updated with important educational announcements and examination notifications."
  },

  "/pricing": {
    title: "Subscription Plans & Pricing | Onlibry",
    description:
      "Explore Onlibry subscription plans and access premium educational resources."
  },

  "/info": {
    title: "Help & Information Center | Onlibry",
    description:
      "Find information about Onlibry, its services, policies and support."
  }
};

function cleanText(value = "") {
  const doc = new DOMParser().parseFromString(
    String(value),
    "text/html"
  );

  doc.querySelectorAll("script, style").forEach(
    el => el.remove()
  );

  return (doc.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImage(value) {
  try {
    const url = new URL(
      value || DEFAULT_META.image,
      DOMAIN
    );

    return url.protocol === "https:"
      ? url.href
      : DEFAULT_META.image;
  } catch {
    return DEFAULT_META.image;
  }
}

export default function MetaX({ post = null }) {
  const { pathname } = useLocation();

  const path = pathname.replace(/\/+$/, "") || "/";

  const isArticle =
    /^\/blog\/[^/]+$/.test(path) &&
    !["/blog/dashboard", "/blog/create", "/blog/edit"]
      .includes(path);

  // Blog metadata is handled after post loading.
  if (isArticle && !post) return null;

  const page = PAGE_META[path];

  const title = post
    ? cleanText(post.meta?.title || post.title)
    : page?.title || DEFAULT_META.title;

  const description = post
    ? cleanText(
        post.meta?.description ||
        post.excerpt ||
        post.content ||
        DEFAULT_META.description
      ).slice(0, 160)
    : page?.description || DEFAULT_META.description;

  const image = normalizeImage(post?.meta?.ogImage);

  const url = post
    ? `${DOMAIN}/blog/${encodeURIComponent(post.slug)}`
    : `${DOMAIN}${path}`;

  const type = post ? "article" : "website";

  return (
    <>
      <title>{title}</title>

      <meta
        name="description"
        content={description}
      />

      <meta name="author" content="Onlibry" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Onlibry" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article metadata */}
      {post?.publishedAt && (
        <meta
          property="article:published_time"
          content={post.publishedAt}
        />
      )}

      {post?.updatedAt && (
        <meta
          property="article:modified_time"
          content={post.updatedAt}
        />
      )}
    </>
  );
}