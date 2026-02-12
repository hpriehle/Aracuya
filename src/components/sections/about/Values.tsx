import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { StaggerChildren } from "@/components/animation/StaggerChildren";

const values = [
  {
    title: "Intention",
    description:
      "Every decision, from the thread count of our linens to the curation of our gardens, is made with purpose.",
  },
  {
    title: "Tranquility",
    description:
      "We create spaces that invite stillness — environments where the noise of the world falls gently away.",
  },
  {
    title: "Authenticity",
    description:
      "Our hospitality is genuine, never performative. We believe warmth cannot be scripted, only felt.",
  },
];

export function Values() {
  return (
    <section className="bg-cream-dark py-24 md:py-32">
      <Container>
        <FadeIn>
          <div className="text-center">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Our Philosophy
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Guiding principles
            </h2>
          </div>
        </FadeIn>

        <StaggerChildren className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
          {values.map((value) => (
            <div key={value.title} className="text-center">
              <h3 className="font-heading text-h3 font-light">{value.title}</h3>
              <p className="mt-4 font-body text-body font-light leading-relaxed text-gray">
                {value.description}
              </p>
            </div>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
