import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { Story } from "@/components/sections/about/Story";
import { Values } from "@/components/sections/about/Values";
import { ContactCTA } from "@/components/sections/home/ContactCTA";

export const metadata: Metadata = {
  title: { absolute: "About Aracuya | Over-Water Villa near Nzulezu" },
  description:
    "Aracuya is a handcrafted floating villa near Nzulezu, the village on stilts. Built with local artisans, supporting the community that inspired it.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Aracuya | Over-Water Villa near Nzulezu",
    description:
      "Aracuya is a handcrafted floating villa near Nzulezu, the village on stilts. Built with local artisans, supporting the community that inspired it.",
    images: [
      {
        url: "/images/about/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Aracuya floating villa near Nzulezu, Ghana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Aracuya | Over-Water Villa near Nzulezu",
    description:
      "Aracuya is a handcrafted floating villa near Nzulezu, the village on stilts. Built with local artisans, supporting the community that inspired it.",
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
