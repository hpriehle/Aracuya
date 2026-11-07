import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_NUMBER } from "@/data/rooms";
import type { NzulezuPhoto } from "@/data/nzulezu";

// Shared pieces of the three Nzulezu pages: /nzulezu (the visitor's guide),
// /nzulezo (history and heritage) and /nzulenzu (a day at the village).

export function PhotoCredit({ photo, light }: { photo: NzulezuPhoto; light?: boolean }) {
  const link = light
    ? "underline underline-offset-2 hover:text-cream"
    : "underline underline-offset-2 hover:text-green";
  return (
    <>
      Photo:{" "}
      <a href={photo.source} target="_blank" rel="noopener noreferrer" className={link}>
        {photo.author}
      </a>
      ,{" "}
      <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer license" className={link}>
        {photo.license}
      </a>
    </>
  );
}

export function Figure({ photo, sizes }: { photo: NzulezuPhoto; sizes: string }) {
  return (
    <figure>
      <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-gray-light">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" />
      </div>
      <figcaption className="mt-2 font-body text-xs font-light text-gray">
        <PhotoCredit photo={photo} />
      </figcaption>
    </figure>
  );
}

export function Section({
  eyebrow,
  title,
  children,
  tinted,
  photo,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  tinted?: boolean;
  photo?: NzulezuPhoto;
}) {
  return (
    <section className={tinted ? "bg-cream-dark py-20 md:py-28" : "py-20 md:py-28"}>
      <Container>
        <div className="mx-auto max-w-2xl">
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
            {eyebrow}
          </span>
          <h2 className="mt-4 font-heading text-h2 font-light">{title}</h2>
          <div className="mt-8 space-y-5 font-body text-body font-light leading-relaxed text-gray">
            {children}
          </div>
        </div>
        {photo && (
          <div className="mx-auto mt-12 max-w-4xl">
            <Figure photo={photo} sizes="(min-width: 1024px) 896px, 100vw" />
          </div>
        )}
      </Container>
    </section>
  );
}

// The H1 is server-rendered and visible without JavaScript, so it can be
// the LCP element straight from the HTML.
export function PhotoHero({
  photo,
  eyebrow,
  title,
  intro,
}: {
  photo: NzulezuPhoto;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative flex min-h-[75vh] w-full items-end overflow-hidden text-cream">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/30" />
      <Container className="relative z-10 pb-14 pt-40 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-cream/75">
            {eyebrow}
          </span>
          <h1 className="mt-6 font-heading text-h1 font-light md:text-display">{title}</h1>
          <p className="mx-auto mt-6 max-w-xl font-body text-body-lg font-light text-cream/85">
            {intro}
          </p>
        </div>
      </Container>
      <p className="absolute bottom-3 right-4 z-10 font-body text-[11px] font-light text-cream/60">
        <PhotoCredit photo={photo} light />
      </p>
    </section>
  );
}

export function Gallery({ title, photos }: { title: string; photos: NzulezuPhoto[] }) {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-5xl">
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
            Gallery
          </span>
          <h2 className="mt-4 font-heading text-h2 font-light">{title}</h2>
          <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <Figure
                key={p.src}
                photo={p}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function VillaStay({
  eyebrow,
  title,
  body,
  placeName,
}: {
  eyebrow: string;
  title: string;
  body: string;
  placeName: string;
}) {
  return (
    <section className="bg-green py-20 text-cream md:py-28">
      <Container>
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <Image
              src="/images/shared/experience.jpg"
              alt="Aracuya, a thatched over-water villa on stilts above the lily-covered water near Beyin"
              fill
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
              {eyebrow}
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">{title}</h2>
            <p className="mt-6 font-body text-body-lg font-light leading-relaxed text-cream/75">
              {body}
            </p>
            <div className="mt-10">
              <Button href="/rooms" variant="dark">
                See the villa
              </Button>
            </div>
            <p className="mt-6 font-body text-small font-light text-cream/70">
              Planning a visit to {placeName}?{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream underline underline-offset-4"
              >
                Ask us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

const guidePages = [
  {
    href: "/nzulezu",
    title: "Nzulezu: how to visit and where to stay",
    blurb: "Getting there from Accra and Takoradi, the canoe from Beyin, and what to know before you go.",
  },
  {
    href: "/nzulezo",
    title: "Nzulezo: the history of the stilt village",
    blurb: "The founding legend, how the village is built, its customs, and its place on UNESCO's Tentative List.",
  },
  {
    href: "/nzulenzu",
    title: "Nzulenzu: a day at the village on the water",
    blurb: "Hour by hour, from the canoe landing at Beyin to the boardwalk and back again.",
  },
];

export function MoreOnNzulezu({ current }: { current: "/nzulezu" | "/nzulezo" | "/nzulenzu" }) {
  return (
    <section className="bg-cream-dark py-20 md:py-24">
      <Container>
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-h3 font-light">More on the village</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {guidePages
              .filter((p) => p.href !== current)
              .map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group block border-t border-gray pt-5 transition-colors"
                >
                  <span className="font-heading text-h4 font-light group-hover:text-green">
                    {p.title} &rarr;
                  </span>
                  <p className="mt-2 font-body text-small font-light leading-relaxed text-gray">
                    {p.blurb}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
