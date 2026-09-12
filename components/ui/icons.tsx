import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 12h15M13.5 5.5 20 12l-6.5 6.5" />
    </svg>
  );
}

export function CheckCircle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m8 12.3 2.7 2.7L16 9.2"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossCircle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m9 9 6 6m0-6-6 6"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlertCircle(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <path d="M12 16.3v.2" />
    </svg>
  );
}

export function ChartBars(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 20v-8M10 20V5M16 20v-8" />
    </svg>
  );
}

export function Target(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Gauge(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.8 15.5A8.5 8.5 0 1 1 19.2 15.5" />
      <path d="m12 15 4.2-4.2" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ListChecks(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.5 6h11M9.5 12h11M9.5 18h7.5" />
      <path d="M3.8 6h.01M3.8 12h.01M3.8 18h.01" strokeWidth={2.4} />
    </svg>
  );
}

/** Brand glyph — a conversation bubble with a pulse. */
export function ChatMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.16.97 4.12 2.56 5.53L4.6 19.58l3.5-1.17c1.2.36 2.5.59 3.9.59 4.97 0 9-3.58 9-8s-4.03-8-9-8Zm-4.08 8.32a1.24 1.24 0 1 1 0-2.48 1.24 1.24 0 0 1 0 2.48Zm4.08 0a1.24 1.24 0 1 1 0-2.48 1.24 1.24 0 0 1 0 2.48Zm4.08 0a1.24 1.24 0 1 1 0-2.48 1.24 1.24 0 0 1 0 2.48Z" />
    </svg>
  );
}