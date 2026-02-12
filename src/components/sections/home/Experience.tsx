import { Container } from "@/components/ui/Container";
import { ParallaxImage } from "@/components/animation/ParallaxImage";
import { FadeIn } from "@/components/animation/FadeIn";

export function Experience() {
  return (
    <section className="py-24 md:py-32">
      <Container wide>
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-8 lg:gap-12">
          <ParallaxImage
            src="/images/shared/experience.jpg"
            alt="Aracuya hotel experience"
            className="aspect-[3/4] md:aspect-[2/3]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          <div className="text-center md:pl-16 lg:pl-24">
            <FadeIn>
              <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
                The Experience
              </span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="mt-4 font-heading text-h2 font-light">
                Crafted for the
                <br />
                discerning traveler
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mx-auto mt-6 max-w-md font-body text-body-lg font-light leading-relaxed text-gray">
                Every moment at Aracuya is an invitation to slow down and savor.
                From the morning light filtering through your suite to an evening
                spent under the stars, we create the space for life&apos;s most
                meaningful moments.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mt-8 flex justify-center gap-12">
                <div>
                  <p className="font-heading text-h2 font-light text-green">
                    15+
                  </p>
                  <p className="mt-1 font-body text-small text-gray">
                    Years of excellence
                  </p>
                </div>
                <div>
                  <p className="font-heading text-h2 font-light text-green">
                    98%
                  </p>
                  <p className="mt-1 font-body text-small text-gray">
                    Guest satisfaction
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
