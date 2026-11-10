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
      { rooms: 3, price: 2000, label: "Entire House" },
      { rooms: 2, price: 1350, label: "2 Rooms" },
      { rooms: 1, price: 700, label: "1 Room" },
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
      hero: "/images/rooms/suite/aracuya-living-room.jpg",
      gallery: [
        "/images/rooms/suite/aracuya-bedroom.jpg",
        "/images/rooms/suite/aracuya-stone-bathroom.jpg",
        "/images/rooms/suite/aracuya-hallway.jpg",
        "/images/rooms/suite/aracuya-windows-over-water.jpg",
      ],
      alts: [
        "The living room at Aracuya, with a long sofa, rattan pendant lights and a timber-slice table",
        "A bedroom at Aracuya with a wooden bed, wood floors and carved doors",
        "Aracuya's stone-walled bathroom",
        "The hallway at Aracuya, with wooden doors to the bedrooms",
        "Floor-to-ceiling windows at Aracuya, looking out over the water",
      ],
    },
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}
