// Contact details from the Contact us design.

export const CONTACT_EMAILS = [
  { label: "General", address: "info@sanchara.lk" },
  { label: "Support", address: "support@sanchara.lk" },
  { label: "Sales", address: "sales@sanchara.lk" },
];

export const CONTACT_PHONE = {
  display: "+94 71 465 5645",
  hours: "Mon – Fri, 9:00 AM – 5:00 PM",
  timeZone: "Sri Lanka Time (GMT+5:30)",
};

export const CONTACT_WHATSAPP = { display: "+94 71 465 5645", number: "94714655645" };

export const CONTACT_ADDRESS = "Moratuwa, Sri Lanka";

// TODO(confirm): the design has no profile URLs yet; add them when known.
export const CONTACT_SOCIALS: { label: string; badge: string; href: string | null }[] = [
  { label: "Instagram", badge: "ig", href: null },
  { label: "LinkedIn", badge: "in", href: null },
  { label: "Facebook", badge: "f", href: null },
];

// Hidden form field real visitors leave empty; bots tend to fill it.
export const HONEYPOT_FIELD = "website";

export const REPLY_PROMISE = "We reply within 24 hours on business days.";

// "+94 71 465 5645" → "tel:+94714655645"
export function telHref(display: string) {
  return `tel:${display.replace(/[^\d+]/g, "")}`;
}
