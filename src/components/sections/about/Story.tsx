import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { ImageReveal } from "@/components/animation/ImageReveal";
import { TextReveal } from "@/components/animation/TextReveal";

export function Story() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Since 2009
            </span>
          </FadeIn>
          <div className="mt-8">
            <TextReveal
              as="p"
              className="font-heading text-h3 font-light leading-relaxed md:text-h2"
            >
              Born from a vision to create a place where luxury is not performed
              but felt, Aracuya was founded on the belief that true hospitality
              lies in the details.
            </TextReveal>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <ImageReveal
            src="/images/about/story-1.jpg"
            alt="Aracuya grounds"
            direction="left"
            aspectRatio="aspect-[4/5]"
          />
          <div className="text-center">
            <FadeIn>
              <h2 className="font-heading text-h3 font-light">
                A legacy of thoughtful detail
              </h2>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-6 font-body text-body font-light leading-relaxed text-gray">
                Every corner of Aracuya tells a story. From the locally sourced
                materials that shape our architecture to the artisanal touches in
                each suite, we have spent years curating an environment that
                feels both extraordinary and deeply familiar.
              </p>
            </FadeIn>
            <FadeIn delay={0.25}>
              <p className="mt-4 font-body text-body font-light leading-relaxed text-gray">
                Our commitment extends beyond aesthetics. We believe in
                hospitality that anticipates, that understands the art of
                presence and absence, knowing when to attend and when to step
                away.
              </p>
            </FadeIn>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="md:order-1">
            <ImageReveal
              src="/images/about/story-2.jpg"
              alt="Aracuya interior detail"
              direction="right"
              aspectRatio="aspect-[4/5]"
            />
          </div>
          <div className="text-center">
            <FadeIn>
              <h2 className="font-heading text-h3 font-light">
                Rooted in nature
              </h2>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-6 font-body text-body font-light leading-relaxed text-gray">
                Aracuya draws its name and its spirit from the natural world.
                Situated amid landscapes of quiet grandeur, our property exists
                in harmony with its surroundings — a philosophy that guides
                everything from our architectural choices to our daily
                operations.
              </p>
            </FadeIn>
            <FadeIn delay={0.25}>
              <p className="mt-4 font-body text-body font-light leading-relaxed text-gray">
                We invite our guests to reconnect — with nature, with
                themselves, and with the simple pleasures that make life
                extraordinary.
              </p>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
