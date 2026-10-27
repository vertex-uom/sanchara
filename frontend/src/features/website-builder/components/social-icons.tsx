import type { SVGProps } from "react";

// Simple outline brand marks, drawn like lucide icons (24px grid, 2px stroke),
// since the installed lucide-react has no brand icons.
type IconProps = SVGProps<SVGSVGElement>;

function Outline({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Outline>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Outline>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.5 2.5 2.5 4.5 5 5" />
    </Outline>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" />
    </Outline>
  );
}
