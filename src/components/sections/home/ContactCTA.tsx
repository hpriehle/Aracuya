import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { Button } from "@/components/ui/Button";

export function ContactCTA() {
  return (
    <section className="bg-green-dark py-24 md:py-32">
      <Container className="text-center">
        <FadeIn>
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
            Begin Your Journey
          </span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="mx-auto mt-6 max-w-2xl font-heading text-h1 font-light text-cream">
            We look forward to welcoming you
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-lg font-body text-body-lg font-light text-cream/60">
            Whether planning a retreat or simply seeking an escape, our team is
            here to craft your perfect stay.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="mt-10">
            <Button href="/contact" variant="dark">
              Get in Touch
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
