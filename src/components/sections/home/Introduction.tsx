import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { TextReveal } from "@/components/animation/TextReveal";

export function Introduction() {
  return (
    <section className="py-24 md:py-32">
      <Container className="text-center">
        <FadeIn>
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
            Welcome
          </span>
        </FadeIn>
        <div className="mx-auto mt-8 max-w-2xl">
          <TextReveal
            as="p"
            className="font-heading text-h3 font-light leading-relaxed text-black md:text-h2"
          >
            Nestled amid nature&apos;s quiet grandeur, Aracuya offers an
            experience crafted for those who appreciate the art of unhurried
            living and timeless beauty.
          </TextReveal>
        </div>
        <FadeIn delay={0.5}>
          <div className="mx-auto mt-12 h-[1px] w-16 bg-green/30" />
        </FadeIn>
      </Container>
    </section>
  );
}
