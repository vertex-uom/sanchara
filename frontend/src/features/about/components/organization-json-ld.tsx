import type { AboutContent } from "../types";

// Organization structured data for SEO (spec: WEMIXT (Pvt) Ltd).
export function OrganizationJsonLd({ organization }: { organization: AboutContent["organization"] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.legalName,
    brand: { "@type": "Brand", name: "Sanchara" },
    email: organization.email,
    telephone: organization.telephone,
    address: {
      "@type": "PostalAddress",
      addressLocality: organization.addressLocality,
      addressCountry: organization.addressCountry,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so content can't close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
