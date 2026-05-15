import type { Metadata } from "next";
import Script from "next/script";
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
    default: "Aracuya | Floating Villa near Nzulezu, Ghana",
    template: "%s | Aracuya",
  },
  description:
    "Ghana's largest floating villa — a luxurious 3-bedroom over-water retreat near Nzulezu in the Western Region. Book directly for the best rate.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aracuya | Floating Villa near Nzulezu, Ghana",
    description:
      "A luxurious over-water villa on stilts near Nzulezu. Three bedrooms, three baths, sweeping views — Ghana's largest floating villa, in the Western Region.",
    type: "website",
    locale: "en_US",
    siteName: "Aracuya",
    images: [
      {
        url: "/images/hero/main.jpg",
        width: 1200,
        height: 630,
        alt: "Aracuya floating villa near Nzulezu, Ghana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aracuya | Floating Villa near Nzulezu, Ghana",
    description:
      "A luxurious over-water villa on stilts near Nzulezu — Ghana's largest floating villa, in the Western Region.",
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
      "Ghana's largest floating villa — a luxurious 3-bedroom over-water retreat near Nzulezu in the Western Region. Book directly for the best rate.",
    url: "https://aracuya.com",
    telephone: "+233597957528",
    email: "info@aracuya.com",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Beyin",
      addressRegion: "Western Region",
      addressCountry: "GH",
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
      <head>
        <Script
          src="https://plausible.io/js/pa-dOObV2-MBMKT5nhiBI0Oq.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
        </Script>
      </head>
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
