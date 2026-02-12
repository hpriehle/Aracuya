import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { BookingWidget } from "@/components/ui/BookingWidget";

export function BookingSection() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <FadeIn>
          <div className="mx-auto max-w-lg">
            <BookingWidget variant="light" />
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
