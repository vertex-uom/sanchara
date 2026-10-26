"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, Check, Link2, Mail, MessageCircle } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { DeviceFrame } from "./device-frame";
import { PreviewSite, siteAddress, siteContent } from "./preview-site";
import { FacebookIcon, InstagramIcon } from "./social-icons";
import { DRAFT_KEYS, useSavedDraft } from "./template-draft";
import { useTemplateStatus } from "./template-status";

type PublishedDraft = { title: string; publishedAt: string | null };

type WebsitePublishedProps = {
  hotelName: string;
  city: string;
  country: string;
  dashboardHref: string;
};

const noSubscription = () => () => {};

// Success screen after Publish: the site on a laptop and phone, the link to
// copy or share, and a QR code.
export function WebsitePublished({
  hotelName,
  city,
  country,
  dashboardHref,
}: WebsitePublishedProps) {
  const status = useTemplateStatus();
  const publish = useSavedDraft<PublishedDraft>(DRAFT_KEYS.publish);
  // Drafts are only readable in the browser; wait before saying "not published".
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const content = siteContent(status, { hotelName, city, country });
  const name = content.hotel.name ?? hotelName;
  const address = siteAddress(name, status.hotel?.type);
  const url = `https://${address}/`;

  if (hydrated && !publish?.publishedAt) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-office-meter-track bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-office-icon">
          Your website is not published yet
        </h1>
        <p className="mt-2 text-sm text-office-muted">
          Choose your web address and publish it from Publish Settings.
        </p>
        <Button
          asChild
          variant="office"
          className="mt-5 h-11 gap-2 px-5 font-semibold"
        >
          <Link href={`${COMPANY_PATHS.website}/publish`}>
            Go to Publish Settings
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      {/* Decorative: the real preview is on the Preview page. */}
      <div
        aria-hidden="true"
        inert
        className="relative mx-auto w-full max-w-xl pr-[12%] pb-[6%]"
      >
        <DeviceFrame device="desktop" url={address} width="100%">
          <PreviewSite content={content} idPrefix="published-desktop" />
        </DeviceFrame>
        <div className="absolute right-0 bottom-0 w-[30%]">
          <DeviceFrame device="mobile" url={address} width="100%">
            <PreviewSite content={content} idPrefix="published-mobile" />
          </DeviceFrame>
        </div>
      </div>

      <div>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-office-primary sm:text-4xl xl:text-5xl">
          Your Website is Successfully Published!
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-office-muted">
          Your website is now live and ready to welcome guests. Share your link
          and start receiving bookings.
        </p>

        <CopyLink url={url} />

        <div className="mt-6 flex flex-wrap items-start gap-6">
          <div>
            <p className="text-sm text-office-muted">Or share directly</p>
            <ShareButtons url={url} title={publish?.title || name} />
          </div>
          <span
            aria-hidden="true"
            className="hidden h-24 w-px self-center bg-office-meter-track sm:block"
          />
          <QrCode url={url} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            asChild
            variant="outline"
            className="h-12 gap-2 border-office-primary bg-card text-[0.95rem] font-semibold text-office-primary hover:bg-office-tint-teal"
          >
            <Link href={`${COMPANY_PATHS.website}/preview`}>
              View Website
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="office"
            className="h-12 text-[0.95rem] font-semibold"
          >
            <Link href={dashboardHref}>Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: select the text so the user can copy it.
      const input = document.getElementById(
        "published-url",
      ) as HTMLInputElement | null;
      input?.select();
    }
  }

  return (
    <div className="mt-7 flex items-center gap-3 rounded-2xl border border-office-meter-track bg-card p-2.5 pl-4 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
      <Link2 aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
      <label htmlFor="published-url" className="sr-only">
        Website link
      </label>
      <input
        id="published-url"
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="focus-ring h-11 min-w-0 flex-1 rounded-lg border border-office-meter-track bg-card px-3 text-sm text-office-icon"
      />
      <Button
        type="button"
        variant="office"
        onClick={copy}
        className="h-11 shrink-0 gap-2 px-5 font-semibold"
      >
        {copied ? <Check aria-hidden="true" className="size-4" /> : null}
        {copied ? "Copied" : "Copy Link"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

function ShareButtons({ url, title }: { url: string; title: string }) {
  const [note, setNote] = useState<string | null>(null);
  const text = `${title} ${url}`;

  async function copyForInstagram() {
    // Instagram has no web share link, so copy the URL for a bio or story.
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied. Paste it in your Instagram bio or story.");
    } catch {
      setNote(
        "Copy the link above and paste it in your Instagram bio or story.",
      );
    }
  }

  return (
    <>
      <ul className="mt-3 flex gap-4">
        <ShareItem
          label="WhatsApp"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          tone="bg-[#25d366] text-white"
        >
          <MessageCircle className="size-5" />
        </ShareItem>
        <ShareItem
          label="Facebook"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          tone="bg-[#1877f2] text-white"
        >
          <FacebookIcon className="size-5" />
        </ShareItem>
        <ShareItem
          label="Instagram"
          onClick={copyForInstagram}
          tone="bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white"
        >
          <InstagramIcon className="size-5" />
        </ShareItem>
        <ShareItem
          label="Email"
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Visit our website: ${url}`)}`}
          tone="bg-office-tint-blue text-office-ink-blue"
        >
          <Mail className="size-5" />
        </ShareItem>
      </ul>
      <p role="status" className="mt-2 max-w-60 text-xs text-office-muted">
        {note}
      </p>
    </>
  );
}

function ShareItem({
  label,
  href,
  onClick,
  tone,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  tone: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-xl border border-office-meter-track bg-card shadow-sm transition-shadow group-hover:shadow-md"
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            tone,
          )}
        >
          {children}
        </span>
      </span>
      <span className="text-xs text-office-icon">{label}</span>
    </>
  );
  const className =
    "focus-ring group flex flex-col items-center gap-1.5 rounded-xl";
  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {inner}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {inner}
        </button>
      )}
    </li>
  );
}

// QR code drawn in the browser, so the link is not sent to a QR service.
function QrCode({ url }: { url: string }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 200,
      color: { dark: "#0b2240", light: "#ffffff" },
    })
      .then((data) => {
        if (current) setImage(data);
      })
      .catch(() => {
        if (current) setImage(null);
      });
    return () => {
      current = false;
    };
  }, [url]);

  return (
    <figure className="flex flex-col items-center gap-2">
      <span className="flex size-20 items-center justify-center rounded-xl border border-office-meter-track bg-white p-1.5 shadow-sm">
        {image ? (
          // A generated data URL, so next/image is not used.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`QR code for ${url}`} className="size-full" />
        ) : null}
      </span>
      <figcaption className="text-xs text-office-icon">
        Scan to Visit
      </figcaption>
    </figure>
  );
}
