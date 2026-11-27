// api/render.js
// RenderX V1.0 - Onlibry SEO Engine

const DOMAIN = "https://onlibry.in";

const PAGES = {
  "/": [
    "Study Materials, Mock Tests & Exam Updates | Onlibry",
    "Prepare for competitive and university exams with study materials, previous year papers, mock tests, quizzes and latest exam updates."
  ],

  "/pricing": [
    "Subscription Plans & Pricing | Onlibry",
    "Explore Onlibry subscription plans and access premium educational resources."
  ],

  "/files": [
    "Previous Year Question Papers & Study Materials | Onlibry",
    "Explore previous year question papers, books, notes and educational resources for university and competitive examinations."
  ],

  "/folders": [
    "Educational Resource Library | Onlibry",
    "Browse organized folders containing academic resources, question papers and study materials."
  ],

  "/mock-tests": [
    "Online Mock Tests for Competitive Exams | Onlibry",
    "Practice online mock tests for ICET, CUET, CPGET and other competitive examinations."
  ],

  "/quizzes": [
    "Online Practice Quizzes | Onlibry",
    "Improve your exam preparation with interactive quizzes and practice questions."
  ],

  "/blog": [
    "Education News & Latest Exam Updates | Onlibry",
    "Read the latest education news, recruitment notifications, examination updates and preparation guides."
  ],

  "/exam-updates": [
    "Latest University Exam Notifications | Onlibry",
    "Find university examination notifications, timetables, registration updates and important announcements."
  ],

  "/notifications": [
    "Latest Education Notifications | Onlibry",
    "Stay updated with important educational announcements and examination notifications."
  ],

  "/info": [
    "Help & Information Center | Onlibry",
    "Find information about Onlibry, its services, policies and support."
  ]
};

const RESERVED = new Set([
  "dashboard",
  "create",
  "edit",
  "admin",
  "login"
]);

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanText(value = "") {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImage(value) {
  if (!value) return null;

  try {
    const url = new URL(value, DOMAIN);

    return url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function createMetadata({
  title,
  description,
  canonical,
  image,
  type
}) {
  const t = escapeHTML(title);
  const d = escapeHTML(description);
  const c = escapeHTML(canonical);
  const i = escapeHTML(image || "");

  return `
    <!-- RenderX V1 -->

    <title data-renderx>${t}</title>

    <meta data-renderx name="description"
      content="${d}" />

    <meta data-renderx name="author"
      content="Onlibry" />

    <link data-renderx rel="canonical"
      href="${c}" />

    <meta data-renderx property="og:type"
      content="${type}" />

    <meta data-renderx property="og:site_name"
      content="Onlibry" />

    <meta data-renderx property="og:title"
      content="${t}" />

    <meta data-renderx property="og:description"
      content="${d}" />

    <meta data-renderx property="og:url"
      content="${c}" />

    ${image ? `
    <meta data-renderx property="og:image"
      content="${i}" />

    <meta data-renderx name="twitter:image"
      content="${i}" />
    ` : ""}

    <meta data-renderx name="twitter:card"
      content="${image ? "summary_large_image" : "summary"}" />

    <meta data-renderx name="twitter:title"
      content="${t}" />

    <meta data-renderx name="twitter:description"
      content="${d}" />
  `;
}

export default async function handler(req, res) {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).send("Method not allowed");
    }

    const rawPath = req.query.path;

    if (typeof rawPath !== "string") {
      return res.status(400).send("Invalid path");
    }

    const path = rawPath.replace(/\/+$/, "") || "/";

    let title;
    let description;
    let image = normalizeImage(
      process.env.SEO_DEFAULT_IMAGE
    );

    let type = "website";
    let canonical = DOMAIN + path;

    // Static public pages
    if (Object.hasOwn(PAGES, path)) {
      [title, description] = PAGES[path];
    }

    // Dynamic blog articles
    else if (/^\/blog\/[a-zA-Z0-9_-]+$/.test(path)) {
      const slug = path.split("/").pop();

      if (RESERVED.has(slug.toLowerCase())) {
        return res.status(404).send("Not found");
      }

      const API_URL = process.env.VITE_BLOG_API_URL;

      if (!API_URL) {
        throw new Error("Blog API URL missing");
      }

      const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/api/post/${encodeURIComponent(slug)}`,
        {
          signal: AbortSignal.timeout(8000)
        }
      );

      if (response.status === 404) {
        return res.status(404).send("Post not found");
      }

      if (!response.ok) {
        throw new Error("Blog API unavailable");
      }

      const data = await response.json();

      if (!data.success || !data.post) {
        throw new Error("Invalid blog API response");
      }

      const post = data.post;

      if (post.slug !== slug) {
        throw new Error("Unexpected post slug");
      }

      title = cleanText(
        post.meta?.title || post.title
      );

      description = cleanText(
        post.meta?.description ||
        post.excerpt ||
        post.content ||
        ""
      ).slice(0, 160);

      image = normalizeImage(
        post.meta?.ogImage
      ) || image;

      canonical =
        `${DOMAIN}/blog/${encodeURIComponent(post.slug)}`;

      type = "article";
    }

    else {
      return res.status(404).send("Not found");
    }

    // Load compiled Vite HTML template.
    // /index.html must remain outside RenderX routing.

    const templateResponse = await fetch(
      `${DOMAIN}/renderx-template.html`,
      {
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!templateResponse.ok) {
      throw new Error("HTML template unavailable");
    }

    const template = await templateResponse.text();

    const marker = "<!-- RENDERX_HEAD -->";

    if (!template.includes(marker)) {
      throw new Error("RenderX marker missing");
    }

    const metadata = createMetadata({
      title,
      description,
      canonical,
      image,
      type
    });

    const html = template.replace(
      marker,
      () => metadata
    );

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30"
    );

    return res.status(200).send(html);

  } catch (error) {
    console.error("RenderX:", error);

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "60");

    return res.status(503).send(
      "Page temporarily unavailable"
    );
  }
}