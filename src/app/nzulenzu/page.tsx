import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { photos } from "@/data/nzulezu";
import { ContactCTA } from "@/components/sections/home/ContactCTA";
import {
  Figure,
  Gallery,
  MoreOnNzulezu,
  PhotoHero,
  VillaStay,
  VillaTeaser,
} from "@/components/sections/nzulezu/GuideParts";

// The day-plan page, written with the "Nzulenzu" spelling so it can rank for
// people who search that way. Practical details are from the Ghana Tourism
// Authority's Nzulezu page; the clock times are a suggested plan, said so.

const TITLE = "Nzulenzu: A Day Trip to Ghana's Village on the Water";
const DESCRIPTION =
  "Plan a day at Nzulenzu, the stilt village on Lake Tadane: the canoe from Beyin, what you will see on the way and in the village, how long it takes, and what else to do nearby.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/nzulenzu" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/nzulenzu",
    type: "article",
    images: [{ url: photos.canoeVillage.src, alt: photos.canoeVillage.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [photos.canoeVillage.src],
  },
};

const steps: {
  when: string;
  title: string;
  body: string;
  photo?: (typeof photos)[keyof typeof photos];
}[] = [
  {
    when: "The night before",
    title: "Sleep in Beyin",
    body: "Nzulenzu is five to seven hours' drive from Accra, so a same-day round trip leaves little time on the water. Arrive in Beyin the evening before and you can take an early canoe.",
  },
  {
    when: "Around 8:00",
    title: "Check in at the Beyin visitor centre",
    body: "The visitor centre opens at 8 am and visits run until 4 pm, every day. Pay the visitor fees here; they go to the community. Canoes leave as they fill, so the early ones mean the shortest wait.",
    photo: photos.parkedCanoe,
  },
  {
    when: "Around 8:30",
    title: "Into the wetland",
    body: "The trip is a guided ride in a dugout canoe, with life jackets provided. In the dry season you walk roughly the first kilometre to where the water is deep enough; from mid-May to August the canoe can go the whole way. The route follows narrow channels through raffia palm and swamp forest, crosses open plains, and finally opens onto Lake Tadane. Watch for egrets, herons and kingfishers.",
    photo: photos.canoeChannel,
  },
  {
    when: "Around 9:30",
    title: "Arrive at Nzulenzu",
    body: "After 45 minutes to an hour on the water, the stilt houses come into view. You step up onto Main Street, the long boardwalk that runs the length of the village, with homes on one side and the school, community centre and small businesses on the other. Your guide walks you through and explains how the village lives on the lake.",
    photo: photos.housesCanoesShore,
  },
  {
    when: "Around 10:30",
    title: "Back across the lake",
    body: "The return canoe retraces the route to Beyin. All told, from the visitor centre and back, allow about three hours.",
  },
  {
    when: "Afternoon",
    title: "The rest of Beyin",
    body: "Fort Apollonia, the old coastal fort, stands in Beyin and takes about half an hour to see from outside. From October to August, the Ghana Wildlife Society runs evening beach walks to watch sea turtles nest or hatch on the beach near the visitor centre.",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "How long does a visit to Nzulenzu take?",
    a: "About three hours from the Beyin visitor centre and back: roughly an hour by canoe each way, plus time walking the village.",
  },
  {
    q: "What time can you visit Nzulenzu?",
    a: "The Ghana Tourism Authority lists visits from 8 am to 4 pm daily. Thursday is the lake's sacred day, so check before planning a Thursday trip.",
  },
  {
    q: "Is the canoe trip to Nzulenzu safe?",
    a: "The trip is guided, in a dugout canoe, and life jackets are provided. Keep phones and cameras in a dry bag.",
  },
  {
    q: "Can you visit Nzulenzu as a day trip from Accra?",
    a: "It is possible but long: five to seven hours' drive each way leaves little time at the village. Most visitors are better off spending the night near Beyin, or flying Accra to Takoradi and driving the last 90 km or so.",
  },
  {
    q: "What else is there to do near Nzulenzu?",
    a: "In Beyin, see Fort Apollonia from outside, and between October and August join an evening walk to watch sea turtles nest or hatch, run by the Ghana Wildlife Society.",
  },
  {
    q: "Is Nzulenzu the same place as Nzulezu and Nzulezo?",
    a: "Yes. Nzulenzu, Nzulezu and Nzulezo are three spellings of the same stilt village on Lake Tadane.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "A day trip to Nzulenzu, Ghana's village on the water",
      description: DESCRIPTION,
      url: "https://aracuya.com/nzulenzu",
      image: `https://aracuya.com${photos.canoeVillage.src}`,
      about: { "@id": "https://aracuya.com/nzulezu#nzulezu" },
      publisher: { "@type": "Organization", name: "Aracuya", url: "https://aracuya.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function NzulenzuPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PhotoHero
        photo={photos.canoeVillage}
        eyebrow="A day trip from Beyin"
        title="A day at Nzulenzu"
        intro="The canoe through the Amansuri wetland, the walk along the village boardwalk, and how to fit it all into one easy day."
      />

      <section className="pb-16 pt-20 md:pb-20 md:pt-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Your day, step by step
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Visiting Nzulenzu from Beyin
            </h2>
            <p className="mt-6 font-body text-body font-light leading-relaxed text-gray">
              Nzulenzu, also spelled Nzulezu and Nzulezo, is a village on stilts
              over Lake Tadane, reached only by canoe from Beyin. The times
              below are our suggested plan, starting early to make the most of
              the cool morning on the water.
            </p>
          </div>
        </Container>
      </section>

      <VillaTeaser
        title="Spend the night before in Beyin"
        body="Aracuya is a three-bedroom over-water villa in Beyin, where the canoe to Nzulenzu leaves. Stay here and you can be on the first canoe out."
        placeName="Nzulenzu"
      />

      <section className="pb-20 md:pb-28">
        <Container>
          <ol className="mx-auto max-w-2xl space-y-14 border-l border-gray-light pl-8">
            {steps.map((s) => (
              <li key={s.title} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full bg-green"
                />
                <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
                  {s.when}
                </span>
                <h3 className="mt-2 font-heading text-h3 font-light">{s.title}</h3>
                <p className="mt-4 font-body text-body font-light leading-relaxed text-gray">
                  {s.body}
                </p>
                {s.photo && (
                  <div className="mt-6">
                    <Figure photo={s.photo} sizes="(min-width: 768px) 640px, 100vw" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-cream-dark py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              What to bring
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Packing for a day on the lake
            </h2>
            <ul className="mt-8 list-disc space-y-3 pl-5 font-body text-body font-light leading-relaxed text-gray">
              <li>Cash in Ghana cedis for visitor fees, paid at the visitor centre</li>
              <li>A hat, sunscreen and drinking water: there is little shade on the open lake</li>
              <li>Insect repellent, and malaria precautions agreed with your doctor before you travel</li>
              <li>A dry bag for your phone and camera</li>
              <li>Shoes you can walk in on wet ground, for the dry-season walk to the canoe</li>
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Questions
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Planning a Nzulenzu trip: common questions
            </h2>
            <div className="mt-10 divide-y divide-gray-light border-y border-gray-light">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-h4 font-light">
                    <h3>{f.q}</h3>
                    <span
                      aria-hidden
                      className="text-green transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 font-body text-body font-light leading-relaxed text-gray">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Gallery
        title="Around Nzulenzu"
        photos={[photos.wetlandReeds, photos.paintedHouse, photos.canoeArrival]}
      />

      <VillaStay
        eyebrow="Where to stay for Nzulenzu"
        title="Start your day on the water"
        body="Aracuya is a three-bedroom over-water villa in Beyin, where the canoe to Nzulenzu leaves. Stay the night before and you can be on the first canoe out, then spend the afternoon on your own deck over the water."
        placeName="Nzulenzu"
      />

      <MoreOnNzulezu current="/nzulenzu" />

      <ContactCTA />
    </>
  );
}
