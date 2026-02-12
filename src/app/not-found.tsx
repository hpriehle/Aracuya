import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center">
      <Container className="text-center">
        <h1 className="font-heading text-display font-light text-black">404</h1>
        <p className="mt-4 font-body text-body-lg font-light text-gray">
          The page you are looking for does not exist.
        </p>
        <div className="mt-10">
          <Button href="/">Return Home</Button>
        </div>
      </Container>
    </section>
  );
}
