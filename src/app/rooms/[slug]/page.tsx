import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getRoomBySlug, rooms } from "@/data/rooms";
import { RoomHero } from "@/components/sections/rooms/RoomHero";
import { RoomDetails } from "@/components/sections/rooms/RoomDetails";
import { RoomGallery } from "@/components/sections/rooms/RoomGallery";
import { RoomAmenities } from "@/components/sections/rooms/RoomAmenities";
import { ContactCTA } from "@/components/sections/home/ContactCTA";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) return { title: "Room Not Found" };

  const ogTitle =
    room.name === "Aracuya"
      ? "Luxury Rooms | Aracuya Boutique Hotel"
      : `${room.name} | Aracuya`;
  const ogAlt =
    room.name === "Aracuya"
      ? "Luxury room interior at Aracuya boutique hotel"
      : `${room.name} at Aracuya`;
  const description = room.description.slice(0, 155).replace(/\s+\S*$/, "...");

  return {
    title:
      room.name === "Aracuya"
        ? "Luxury Rooms"
        : room.name,
    description,
    alternates: {
      canonical: `/rooms/${room.slug}`,
    },
    openGraph: {
      title: ogTitle,
      description,
      images: [
        {
          url: room.images.hero,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [room.images.hero],
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://aracuya.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Rooms",
        item: "https://aracuya.com/rooms",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: room.name,
        item: `https://aracuya.com/rooms/${room.slug}`,
      },
    ],
  };

  const roomJsonLd = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.name,
    description: room.description,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: room.occupancy,
    },
    bed: {
      "@type": "BedDetails",
      typeOfBed: room.bedType,
    },
    amenityFeature: room.amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
    })),
    image: `https://aracuya.com${room.images.hero}`,
    containedInPlace: {
      "@type": "Hotel",
      name: "Aracuya",
      url: "https://aracuya.com",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: room.pricingTiers[0].price,
      url: `https://aracuya.com/rooms/${room.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roomJsonLd) }}
      />
      <RoomHero room={room} />
      <RoomDetails room={room} />
      <RoomGallery room={room} />
      <RoomAmenities room={room} />
      <ContactCTA />
    </>
  );
}
