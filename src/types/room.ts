export interface PricingTier {
  rooms: number;
  price: number;
  label: string;
}

export interface Room {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricingTiers: PricingTier[];
  totalRooms: number;
  size: string;
  bedType: string;
  occupancy: number;
  amenities: string[];
  airbnbUrl: string;
  images: {
    hero: string;
    gallery: string[];
  };
}
