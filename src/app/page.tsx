import { Metadata } from "next";
import { Hero } from "@/components/sections/home/Hero";
import { Introduction } from "@/components/sections/home/Introduction";
import { FeaturedRoom } from "@/components/sections/home/FeaturedRoom";
import { Experience } from "@/components/sections/home/Experience";
import { ContactCTA } from "@/components/sections/home/ContactCTA";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Introduction />
      <FeaturedRoom />
      <Experience />
      <ContactCTA />
    </>
  );
}
