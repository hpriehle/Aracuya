import { Room } from "@/types/room";

export const WHATSAPP_NUMBER = "233551542355";

export const rooms: Room[] = [
  {
    slug: "suite",
    name: "Aracuya",
    tagline: "Where elegance meets tranquility",
    description:
      "A sanctuary of refined luxury, Aracuya offers sweeping views and meticulous attention to detail. From the hand-selected furnishings to the curated art collection, every element has been thoughtfully chosen to create an atmosphere of serene sophistication.",
    pricingTiers: [
      { rooms: 1, price: 50, label: "1 Room" },
      { rooms: 2, price: 80, label: "2 Rooms" },
      { rooms: 3, price: 100, label: "Entire House" },
    ],
    totalRooms: 3,
    size: "85 m²",
    bedType: "King",
    occupancy: 2,
    amenities: [
      "Panoramic views",
      "Marble bathroom",
      "Rain shower",
      "Soaking tub",
      "Mini bar",
      "Nespresso machine",
      "Complimentary Wi-Fi",
      "Twice-daily housekeeping",
      "Pillow menu",
      "In-room safe",
      "Bathrobes & slippers",
      "Turndown service",
    ],
    airbnbUrl: "https://airbnb.com/h/aracuya",
    images: {
      hero: "/images/rooms/suite/hero.jpg",
      gallery: [
        "/images/rooms/suite/gallery-1.jpg",
        "/images/rooms/suite/gallery-2.jpg",
        "/images/rooms/suite/gallery-3.jpg",
        "/images/rooms/suite/gallery-4.jpg",
      ],
    },
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}
