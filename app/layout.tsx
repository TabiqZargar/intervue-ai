import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Intervue AI",
    template: "%s | Intervue AI",
  },
  description:
    "Personalized technical interviews based on your AI engineering learning journey.",
};

const themeScript = `(function () {
  try {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    var light = window.matchMedia("(prefers-color-scheme: light)");
    var root = document.documentElement;
    function apply() {
      root.setAttribute("data-theme", dark.matches || !light.matches ? "dark" : "light");
    }
    apply();
    if (typeof dark.addEventListener === "function") {
      dark.addEventListener("change", apply);
      light.addEventListener("change", apply);
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Sets data-theme before first paint to avoid a theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}