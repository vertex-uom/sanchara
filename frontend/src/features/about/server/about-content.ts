import type { AboutContent } from "../types";

function placeholderImage(label: string, background: string, text: string) {
  return `https://placehold.co/800x1000/${background}/${text}/png?text=${encodeURIComponent(label)}`;
}

// TEMPORARY fixture with the copy from the About design. Replace the body with
// the content API call once it exists; the return type stays the same.
// Bracketed values and `placeholder: true` must be replaced with real data.
export async function getAboutContent(): Promise<AboutContent> {
  return {
    hero: {
      titleLead: "Sanchara makes it simple to find and book stays",
      titleAccent: "you can trust.",
      body: "A directory of small, independently owned stays across Sri Lanka. Discover them here, then book directly on each property's own website — commission-free.",
      primary: { label: "Explore stays", href: "/properties" },
      secondary: { label: "Contact us", href: "/contact" },
    },
    story: {
      title: "Why Sanchara started.",
      paragraphs: [
        "Most guest houses, home stays and villas in Sri Lanka have fewer than twenty rooms — yet they pay heavy commissions to online travel agencies for every booking. Sanchara was created by WEMIXT (Pvt) Ltd to change that: each business gets its own booking website, transparent Sri Lankan taxes and a simple back office, while travellers discover them in one trusted directory.",
      ],
      started: { text: "Started in [year] in [city], Sri Lanka", placeholder: true },
      quote: {
        text: "Small hosts are the heart of Sri Lankan hospitality. They deserve direct guests and fair tools — not commission bills.",
        author: "[Founder name]",
        role: "[Role], WEMIXT (Pvt) Ltd",
        placeholder: true,
      },
    },
    pillars: [
      {
        title: "Mission",
        text: "Give small Sri Lankan accommodation businesses the tools to take bookings directly, without commission.",
      },
      { title: "Vision", text: "A Sri Lanka where every independent host can reach travellers on their own terms." },
      {
        title: "Our promise to travellers",
        text: "Real places, real reviews, and the full price — taxes included — before you pay.",
      },
    ],
    differentiators: {
      title: "Built for trust.",
      intro: "Everything a traveller needs to book a small Sri Lankan stay with confidence.",
      items: [
        {
          icon: "badge-check",
          title: "Verified properties",
          text: "Every company account is opened by WEMIXT, with the property's SLTDA registration details on file.",
        },
        {
          icon: "receipt",
          title: "Transparent pricing",
          text: "Service Charge, TDL, SSCL and VAT are itemised, so you see the full total before paying.",
        },
        {
          icon: "lock",
          title: "Secure payments",
          text: "Residents pay in LKR through PayHere; non-residents pay in USD by card, through a secure gateway.",
        },
        {
          icon: "star",
          title: "Real reviews",
          text: "Only guests with a completed stay can review. Duplicates, spam and fake ratings are blocked.",
        },
        {
          icon: "handshake",
          title: "Direct with your host",
          text: "Book on the property's own site and reach the property directly by WhatsApp or phone.",
        },
        {
          icon: "file-text",
          title: "Clear policies",
          text: "Each property's cancellation policy is written by the host and shown before you book.",
        },
      ],
    },
    howItWorks: {
      title: "Four simple steps.",
      intro: "From discovering a property to leaving a review after your stay.",
      steps: [
        { icon: "search", title: "Search", text: "Browse the directory by location, property type and rating." },
        {
          icon: "scale",
          title: "Compare & choose",
          text: "Read verified reviews and open the property's own website.",
        },
        { icon: "credit-card", title: "Book securely", text: "See taxes itemised, then pay in full in LKR or USD." },
        {
          icon: "key",
          title: "Stay & enjoy",
          text: "Check in at the front desk. The property is a message away.",
        },
      ],
      afterBookingTitle: "What happens after you book",
      afterBooking: [
        {
          icon: "mail",
          title: "Confirmation",
          text: "Booking confirmation and receipt by email — and WhatsApp if you added a number.",
        },
        {
          icon: "message",
          title: "Talk to the property",
          text: "Questions or changes go straight to the property by WhatsApp or phone.",
        },
        {
          icon: "calendar-check",
          title: "Check-in",
          text: "The front desk checks you in and records any extra charges on your folio.",
        },
        { icon: "pen", title: "Review your stay", text: "After check-out, leave a verified review on the directory." },
      ],
    },
    safety: {
      title: "Safe by design.",
      intro: "How we keep properties real, reviews honest and your payments protected.",
      groups: [
        {
          icon: "badge-check",
          title: "How properties are verified",
          points: [
            "Company accounts are opened only by WEMIXT",
            "SLTDA registration details recorded for each property",
            "Suspended companies are hidden from the directory",
          ],
        },
        {
          icon: "star",
          title: "How reviews stay authentic",
          points: [
            "Only guests with a verified stay can review",
            "One review per stay — duplicates are blocked",
            "Spam and fake submissions are filtered out",
          ],
        },
        {
          icon: "shield",
          title: "Payments & data protection",
          points: [
            "PayHere for LKR, international card gateway for USD",
            "Card details handled by the payment gateway, not stored by properties",
            "Encrypted connections (SSL/TLS)",
          ],
        },
        {
          icon: "alert",
          title: "If something goes wrong",
          points: [
            "Contact the property directly from your Traveller Dashboard",
            "Cancellations and refunds are handled by the property, following its own policy",
            "Our team can help you reach the property",
          ],
        },
      ],
      paymentBadges: ["PayHere", "Visa", "Mastercard", "SSL"],
      links: [
        { label: "Policies", href: null },
        { label: "Safety Center", href: null },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
    numbers: {
      title: "Sanchara in numbers",
      stats: [
        { value: "20", label: "Companies in the pilot" },
        { value: "50+", label: "Properties listed" },
        { value: "9", label: "Regions" },
        { value: "3,000+", label: "Happy guests" },
        { value: "4.7", label: "Average rating" },
        { value: "2", label: "Currencies: LKR & USD" },
      ],
      placeholder: true,
    },
    destinations: {
      title: "Places travellers love.",
      items: [
        {
          name: "Ella",
          region: "Hill country",
          imageUrl: placeholderImage("Ella", "1C5B52", "DDF3F4"),
          position: { lat: 6.867, lng: 81.046 },
        },
        // Coastal pins sit slightly inland so they land on the simplified map outline.
        {
          name: "Galle",
          region: "South coast",
          imageUrl: placeholderImage("Galle", "38A392", "FFF9F1"),
          position: { lat: 6.05, lng: 80.24 },
        },
        {
          name: "Sigiriya",
          region: "Cultural triangle",
          imageUrl: placeholderImage("Sigiriya", "8FC7CF", "1C5B52"),
          position: { lat: 7.957, lng: 80.76 },
        },
        {
          name: "Mirissa",
          region: "Beaches & surf",
          imageUrl: placeholderImage("Mirissa", "126B6D", "FFF9F1"),
          position: { lat: 5.975, lng: 80.46 },
        },
      ],
      topRatedTitle: "Top-rated properties",
    },
    voices: {
      title: "What guests say.",
      testimonials: [
        {
          quote: "Booking straight from the host's own site felt personal, and the taxes were clear before we paid.",
          name: "Sophie",
          country: "United Kingdom",
          stayedAt: "Serene Hills Retreat, Ella",
        },
        {
          quote: "Paid in rupees in a minute, and the host messaged us on WhatsApp the same day.",
          name: "Nimal",
          country: "Sri Lanka",
          stayedAt: "Ocean Breeze, Unawatuna",
        },
        {
          quote: "Lovely villa and honest reviews — what we saw is exactly what we got.",
          name: "Lena",
          country: "Germany",
          stayedAt: "Sunrise Villa, Matale",
        },
      ],
      rating: {
        average: 4.7,
        reviewCountLabel: "from [N] verified reviews",
        distribution: [
          { stars: 5, ratio: 0.72 },
          { stars: 4, ratio: 0.2 },
          { stars: 3, ratio: 0.05 },
          { stars: 2, ratio: 0.02 },
          { stars: 1, ratio: 0.01 },
        ],
        placeholder: true,
      },
      moreReviews: { label: "Read more reviews", href: "/properties?sort=reviews" },
    },
    values: {
      title: "What we stand for.",
      items: [
        { icon: "shield", title: "Trust", text: "Real properties, real reviews." },
        { icon: "heart", title: "Hospitality", text: "Small hosts at the heart of every stay." },
        { icon: "receipt", title: "Transparency", text: "Full prices and taxes, up front." },
        { icon: "users", title: "Inclusion", text: "Welcoming every traveller, resident or not." },
        { icon: "map-pin", title: "Local impact", text: "More of every booking stays in Sri Lanka." },
      ],
      commitments: [
        {
          icon: "leaf",
          title: "Sustainability & community",
          paragraphs: [
            "Commission-free bookings keep more income with local, independently owned businesses — many of them family-run guest houses and home stays.",
            "Community programmes and eco initiatives: [to be announced]",
          ],
        },
        {
          icon: "accessibility",
          title: "Accessibility commitment",
          paragraphs: [
            "We design the website to meet WCAG 2.1 AA: keyboard navigation, alt text on images, captions for video and respect for reduced-motion settings.",
            "Property accessibility details are provided by each host.",
          ],
        },
      ],
    },
    cta: {
      title: "Ready for your next stay?",
      body: "Find a property in the directory, then book directly with the host.",
      primary: { label: "Search stays", href: "/properties" },
      secondary: { label: "Contact us", href: "/contact" },
    },
    // TODO(confirm): registered address and number are placeholders in the design.
    organization: {
      legalName: "WEMIXT (Pvt) Ltd",
      email: "sanchara@gmail.com",
      telephone: "+94 71461045",
      addressLocality: "Moratuwa",
      addressCountry: "LK",
    },
  };
}
