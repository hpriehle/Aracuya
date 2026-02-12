import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { BookingWidget } from "@/components/ui/BookingWidget";
import { Button } from "@/components/ui/Button";
import { rooms } from "@/data/rooms";

export const metadata: Metadata = {
  title: "Rooms & Booking",
  description:
    "Explore our beautifully appointed rooms at Aracuya. Book one room, two, or take the entire house for a private retreat in Paradise Valley, Arizona.",
  alternates: {
    canonical: "/rooms",
  },
  openGraph: {
    title: "Rooms & Booking | Aracuya",
    description:
      "Explore our beautifully appointed rooms at Aracuya. Book one room, two, or take the entire house for a private retreat in Paradise Valley, Arizona.",
    images: [
      {
        url: "/images/rooms/suite/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Luxury room at Aracuya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rooms & Booking | Aracuya",
    description:
      "Explore our beautifully appointed rooms at Aracuya. Book one room, two, or take the entire house for a private retreat in Paradise Valley, Arizona.",
    images: ["/images/rooms/suite/hero.jpg"],
  },
};

export default function RoomsPage() {
  const property = rooms[0];

  return (
    <>
      <section className="pt-40 pb-24 md:pt-48 md:pb-32">
        <Container>
          <div className="text-center">
            <FadeIn>
              <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
                Accommodations
              </span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="mt-4 font-heading text-h1 font-light">
                Our Rooms
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mx-auto mt-4 max-w-lg font-body text-body-lg font-light text-gray">
                Our house features {property.totalRooms} beautifully appointed
                rooms. Book one, two, or take the entire house for yourself.
              </p>
            </FadeIn>
          </div>

          <div className="mt-16 grid items-start gap-12 md:grid-cols-2 md:gap-16">
            <FadeIn>
              <Link
                href={`/rooms/${property.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden"
              >
                <Image
                  src={property.images.hero}
                  alt={property.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </Link>

              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
                {property.images.gallery.slice(0, 2).map((src, i) => (
                  <Link
                    key={i}
                    href={`/rooms/${property.slug}`}
                    className="group relative aspect-square overflow-hidden"
                  >
                    <Image
                      src={src}
                      alt={`${property.name} - Photo ${i + 2}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="text-center">
                <Link href={`/rooms/${property.slug}`}>
                  <h2 className="font-heading text-h2 font-light transition-colors duration-300 hover:text-green">
                    {property.name}
                  </h2>
                </Link>
                <p className="mt-2 font-body text-body font-light text-gray">
                  {property.tagline}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2">
                  <span className="font-body text-small text-gray">
                    {property.size}
                  </span>
                  <span className="font-body text-small text-gray">
                    {property.totalRooms} rooms
                  </span>
                  <span className="font-body text-small text-gray">
                    Up to {property.occupancy * property.totalRooms} guests
                  </span>
                </div>

                <p className="mt-6 font-body text-body font-light leading-relaxed text-gray">
                  {property.description}
                </p>

                <div className="mt-8">
                  <BookingWidget />
                </div>

                <Button href={`/rooms/${property.slug}`} variant="outline" size="sm" className="mt-6">
                  View Gallery & Details
                </Button>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>
    </>
  );
}
