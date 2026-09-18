import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { jsonLdString } from "@/lib/json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FlyDealFinder — Find Cheap Flights Anywhere",
    template: "%s | FlyDealFinder",
  },
  description:
    "Discover cheap flights from Sydney and destinations around the world. Search flexible dates and find affordable flight deals.",
  openGraph: {
    type: "website",
    siteName: "FlyDealFinder",
    title: "FlyDealFinder — Find Cheap Flights Anywhere",
    description: "Search thousands of flight options and discover where you can travel for less.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FlyDealFinder — Find Cheap Flights Anywhere",
    description: "Search thousands of flight options and discover where you can travel for less.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FlyDealFinder",
  url: siteUrl,
  description: "Flight-deal discovery: find cheap flights anywhere in the world.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FlyDealFinder",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?destination=ANYWHERE&origin={origin}`,
    "query-input": "required name=origin",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd) }}
        />
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
