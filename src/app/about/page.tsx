import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { Story } from "@/components/sections/about/Story";
import { Values } from "@/components/sections/about/Values";
import { ContactCTA } from "@/components/sections/home/ContactCTA";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Discover the story behind Aracuya. Founded on the belief that true hospitality lies in the details — a legacy of refined elegance, thoughtful design, and natural beauty since 2009.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Our Story | Aracuya",
    description:
      "Discover the story behind Aracuya. Founded on the belief that true hospitality lies in the details — a legacy of refined elegance, thoughtful design, and natural beauty since 2009.",
    images: [
      {
        url: "/images/about/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Aracuya hotel surrounded by natural landscape",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story | Aracuya",
    description:
      "Discover the story behind Aracuya. Founded on the belief that true hospitality lies in the details — a legacy of refined elegance, thoughtful design, and natural beauty since 2009.",
    images: ["/images/about/hero.jpg"],
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Story />
      <Values />
      <ContactCTA />
    </>
  );
}
