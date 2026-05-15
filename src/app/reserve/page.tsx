import { Metadata } from "next";
import Image from "next/image";
import { BookingWidget } from "@/components/ui/BookingWidget";

export const metadata: Metadata = {
  title: "Reserve",
  description:
    "Book your stay at Aracuya. Choose one room, two, or the entire over-water villa near Nzulezu in Ghana's Western Region.",
  alternates: {
    canonical: "/reserve",
  },
  openGraph: {
    title: "Reserve | Aracuya",
    description:
      "Book your stay at Aracuya. Choose one room, two, or the entire over-water villa near Nzulezu in Ghana's Western Region.",
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
    title: "Reserve | Aracuya",
    description:
      "Book your stay at Aracuya. Choose one room, two, or the entire over-water villa near Nzulezu in Ghana's Western Region.",
    images: ["/images/hero/main.jpg"],
  },
};

export default function ReservePage() {
  return (
    <section className="relative min-h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 bg-black/50 z-10" />

      <Image
        src="/images/hero/main.jpg"
        alt="Aracuya luxury hotel"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-20 flex min-h-dvh items-center justify-center px-5 py-32">
        <div className="w-full max-w-md">
          <BookingWidget variant="dark" />
        </div>
      </div>
    </section>
  );
}
