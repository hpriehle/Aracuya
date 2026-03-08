"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageReveal } from "@/components/animation/ImageReveal";
import { FadeIn } from "@/components/animation/FadeIn";
import { Button } from "@/components/ui/Button";
import { rooms } from "@/data/rooms";
import { useCurrency } from "@/context/CurrencyContext";

const room = rooms[0];

export function FeaturedRoom() {
  const { formatPrice } = useCurrency();

  return (
    <section className="py-24 md:py-32">
      <Container>
        <SectionHeading
          title="Our Rooms"
          subtitle="Book one room, two, or the entire house"
        />

        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <ImageReveal
            src={room.images.hero}
            alt="Luxury suite interior at Aracuya"
            direction="left"
            aspectRatio="aspect-[3/4]"
          />

          <div className="text-center">
            <FadeIn>
              <p className="font-body text-body-lg font-light leading-relaxed text-gray">
                {room.description}
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="font-body text-small text-gray">From</span>
                <span className="font-heading text-h2 font-light text-green">
                  {formatPrice(room.pricingTiers[0].price)}
                </span>
                <span className="font-body text-small text-gray">/ night</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {room.pricingTiers.map((tier) => (
                  <div
                    key={tier.rooms}
                    className="border border-gray-light px-3 py-3 text-center"
                  >
                    <span className="block font-body text-xs uppercase tracking-widest text-gray">
                      {tier.label}
                    </span>
                    <p className="mt-1 font-heading text-h4 font-light text-green">
                      {formatPrice(tier.price)}
                    </p>
                    <span className="block font-body text-xs text-gray">
                      / night
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10">
                <Button href="/rooms">View Rooms & Book</Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
