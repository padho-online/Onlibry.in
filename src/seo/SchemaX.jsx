// src/seo/SchemaX.jsx
// SchemaX V1.0 - Onlibry SEO Engine

import { useLocation } from "react-router-dom";

const DOMAIN = "https://onlibry.in";

const PAGES = {
  "/": "Home",
  "/pricing": "Subscription Plans",
  "/files": "Study Materials",
  "/folders": "Resource Library",
  "/mock-tests": "Mock Tests",
  "/quizzes": "Practice Quizzes",
  "/blog": "Education News",
  "/exam-updates": "Exam Updates",
  "/notifications": "Notifications",
  "/info": "Help & Information Center"
};

const COLLECTIONS = new Set([
  "/files",
  "/folders",
  "/mock-tests",
  "/quizzes",
  "/blog",
  "/exam-updates",
  "/notifications"
]);

function validDate(value) {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString();
}

function cleanText(value = "") {
  const doc = new DOMParser().parseFromString(
    String(value),
    "text/html"
  );

  doc.querySelectorAll("script, style")
    .forEach(el => el.remove());

  return (doc.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SchemaX({ post = null }) {
  const { pathname } = useLocation();

  const path = pathname.replace(/\/+$/, "") || "/";

  if (!post && !Object.hasOwn(PAGES, path)) {
    return null;
  }

  const url = post
    ? `${DOMAIN}/blog/${encodeURIComponent(post.slug)}`
    : `${DOMAIN}${path}`;

  const organization = {
    "@type": "Organization",
    "@id": `${DOMAIN}/#organization`,
    name: "Onlibry",
    url: `${DOMAIN}/`
  };

  const website = {
    "@type": "WebSite",
    "@id": `${DOMAIN}/#website`,
    name: "Onlibry",
    url: `${DOMAIN}/`,
    publisher: {
      "@id": `${DOMAIN}/#organization`
    },
    inLanguage: "en"
  };

  const webpage = {
    "@type": COLLECTIONS.has(path)
      ? "CollectionPage"
      : "WebPage",

    "@id": `${url}#webpage`,
    url,

    name: post
      ? post.title
      : PAGES[path],

    isPartOf: {
      "@id": `${DOMAIN}/#website`
    },

    inLanguage: "en"
  };

  const graph = [
    organization,
    website,
    webpage
  ];

  // Breadcrumbs
  if (path !== "/") {
    const items = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${DOMAIN}/`
      }
    ];

    if (post) {
      items.push({
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${DOMAIN}/blog`
      });
    }

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: post ? post.title : PAGES[path],
      item: url
    });

    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: items
    });

    webpage.breadcrumb = {
      "@id": `${url}#breadcrumb`
    };
  }

  // Dynamic blog article schema
  if (post) {
    const article = {
      "@type": "BlogPosting",
      "@id": `${url}#article`,

      headline: post.title,

      description: cleanText(
        post.meta?.description ||
        post.excerpt ||
        post.content ||
        ""
      ).slice(0, 160),

      url,

      mainEntityOfPage: {
        "@id": `${url}#webpage`
      },

      author: {
        "@type": "Person",
        name: post.authorName
      },

      publisher: {
        "@id": `${DOMAIN}/#organization`
      },

      datePublished: validDate(
        post.publishedAt || post.createdAt
      ),

      dateModified: validDate(
        post.updatedAt ||
        post.publishedAt ||
        post.createdAt
      ),

      inLanguage: "en"
    };

    if (
      !post.authorName ||
      post.authorName === "Onlibry Team"
    ) {
      article.author = {
        "@id": `${DOMAIN}/#organization`
      };
    }

    if (post.meta?.ogImage) {
      try {
        const image = new URL(
          post.meta.ogImage,
          DOMAIN
        );

        if (image.protocol === "https:") {
          article.image = [image.href];
        }
      } catch {
        // Ignore invalid image URL
      }
    }

    graph.push(article);
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema).replace(
        /</g,
        "\\u003c"
      )}
    </script>
  );
}