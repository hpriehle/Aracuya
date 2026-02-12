import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CurrencyProvider } from "@/context/CurrencyContext";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aracuya.com"),
  title: {
    default: "Aracuya | Luxury Boutique Hotel in Paradise Valley",
    template: "%s | Aracuya",
  },
  description:
    "Experience refined luxury at Aracuya — a boutique hotel in Paradise Valley, Arizona. Three beautifully appointed rooms, curated experiences, and the art of unhurried living.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aracuya | Luxury Boutique Hotel in Paradise Valley",
    description:
      "Experience refined luxury at Aracuya — a boutique hotel in Paradise Valley, Arizona. Three beautifully appointed rooms, curated experiences, and the art of unhurried living.",
    type: "website",
    locale: "en_US",
    siteName: "Aracuya",
    images: [
      {
        url: "/images/hero/main.jpg",
        width: 1200,
        height: 630,
        alt: "Aracuya Luxury Hotel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aracuya | Luxury Boutique Hotel in Paradise Valley",
    description:
      "Experience refined luxury at Aracuya — a boutique hotel in Paradise Valley, Arizona. Three beautifully appointed rooms, curated experiences, and the art of unhurried living.",
    images: ["/images/hero/main.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "Aracuya",
    description:
      "Experience refined luxury at Aracuya — a boutique hotel in Paradise Valley, Arizona. Three beautifully appointed rooms, curated experiences, and the art of unhurried living.",
    url: "https://aracuya.com",
    telephone: "+15550000000",
    email: "info@aracuya.com",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Tranquility Lane",
      addressLocality: "Paradise Valley",
      addressRegion: "AZ",
      postalCode: "85253",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.7311,
      longitude: -111.9431,
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi" },
      { "@type": "LocationFeatureSpecification", name: "Concierge Service" },
      { "@type": "LocationFeatureSpecification", name: "Room Service" },
    ],
    checkinTime: "15:00",
    checkoutTime: "11:00",
    numberOfRooms: 3,
    image: "https://aracuya.com/images/hero/main.jpg",
    sameAs: ["https://airbnb.com/h/aracuya"],
  };

  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <noscript>
          <style>{`.opacity-0 { opacity: 1 !important; }`}</style>
        </noscript>
        <CurrencyProvider>
          <SmoothScroll>
            <Header />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </CurrencyProvider>
      </body>
    </html>
  );
}
