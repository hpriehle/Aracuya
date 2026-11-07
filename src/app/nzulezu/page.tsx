import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { galleryPhotos, NZULEZU_COORDS, photos } from "@/data/nzulezu";
import { ContactCTA } from "@/components/sections/home/ContactCTA";
import {
  Gallery,
  MoreOnNzulezu,
  PhotoHero,
  Section,
  VillaStay,
} from "@/components/sections/nzulezu/GuideParts";

const TITLE = "Nzulezu Stilt Village, Ghana: How to Visit & Where to Stay";
const DESCRIPTION =
  "Nzulezu, also spelled Nzulezo or Nzulenzu, is a village built on stilts over Lake Tadane in Ghana's Western Region. How to get there from Accra and Takoradi, the canoe from Beyin, when to go, and where to stay nearby.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/nzulezu" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/nzulezu",
    type: "article",
    images: [{ url: photos.villageRow.src, alt: photos.villageRow.alt }],
  },
  twitter: {
    card: "summary_large_image",
    images: [photos.villageRow.src],
    title: TITLE,
    description: DESCRIPTION,
  },
};

const facts: { label: string; value: string }[] = [
  {
    label: "Where",
    value:
      "On Lake Tadane in the Amansuri wetland, near Beyin in the Jomoro district of Ghana's Western Region, about 90 km west of Takoradi",
  },
  {
    label: "Getting in",
    value: "By canoe only, about an hour each way from Beyin through the wetland",
  },
  {
    label: "The name",
    value:
      "Nzulezu means “water surface” in the Nzema language. You will also see it spelled Nzulezo and Nzulenzu",
  },
  { label: "Who lives there", value: "A community of more than 500 people" },
  {
    label: "Heritage",
    value: "On UNESCO's World Heritage Tentative List since 2000",
  },
  { label: "Rest day", value: "Thursday, the lake's sacred day" },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Where is Nzulezu?",
    a: "Nzulezu is in the Jomoro district of Ghana's Western Region, near the coastal town of Beyin and about 90 km west of Takoradi. The village stands on stilts over Lake Tadane, inside the Amansuri wetland.",
  },
  {
    q: "How do you get to Nzulezu?",
    a: "Travel by road to Beyin, either from Accra along the coastal highway or from Takoradi. From Beyin, a canoe takes you through the Amansuri wetland to the village. There is no road to Nzulezu; the canoe is the only way in.",
  },
  {
    q: "How long is the canoe ride to Nzulezu?",
    a: "About an hour each way. Allow half a day in total for the canoe out, time in the village and the canoe back.",
  },
  {
    q: "How far is Nzulezu from Accra?",
    a: "Roughly 316 km. By road that is usually five to seven hours, depending on traffic and stops. You can shorten it by flying from Accra to Takoradi, which takes about 40 minutes, and driving the last 90 km or so to Beyin.",
  },
  {
    q: "What does Nzulezu mean?",
    a: "“Water surface” in Nzema, the language spoken in this part of the Western Region.",
  },
  {
    q: "Is it Nzulezu, Nzulezo or Nzulenzu?",
    a: "All three are used for the same place. Nzulezu and Nzulezo are the most common, and Wikipedia lists the village as Nzulezo; Nzulenzu is a frequent variant. Whichever spelling you search for, it is the same stilt village on Lake Tadane.",
  },
  {
    q: "Is Nzulezu a UNESCO World Heritage Site?",
    a: "Not yet. Ghana placed Nzulezu on UNESCO's World Heritage Tentative List in 2000, the step before a site can be nominated for the full list.",
  },
  {
    q: "Can you visit Nzulezu on a Thursday?",
    a: "Thursday is the lake's sacred day, when the community sets work on the water aside. Do not plan your canoe trip for a Thursday without confirming first.",
  },
  {
    q: "When is the best time to visit Nzulezu?",
    a: "The dry season, from November to March, brings lower humidity and calmer travel along the coast. At any time of year, go early in the day: canoes leave Beyin as they fill, and mornings are cooler on the water.",
  },
  {
    q: "Where can you stay near Nzulezu?",
    a: "Aracuya is a three-bedroom over-water villa in Beyin, where the canoe trip to Nzulezu begins. Staying the night means you can be on the water early instead of driving from Accra the same morning.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TouristAttraction",
      "@id": "https://aracuya.com/nzulezu#nzulezu",
      name: "Nzulezu",
      alternateName: ["Nzulezo", "Nzulenzu", "Nzulezu Stilt Village"],
      description:
        "A village built entirely on stilts over Lake Tadane in the Amansuri wetland, reached by canoe from Beyin.",
      url: "https://aracuya.com/nzulezu",
      image: `https://aracuya.com${photos.villageRow.src}`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: NZULEZU_COORDS.lat,
        longitude: NZULEZU_COORDS.lng,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Beyin",
        addressRegion: "Western Region",
        addressCountry: "GH",
      },
      sameAs: ["https://en.wikipedia.org/wiki/Nzulezo"],
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

const mapQuery = `${NZULEZU_COORDS.lat},${NZULEZU_COORDS.lng}`;
const MAP_EMBED = `https://www.google.com/maps?q=${mapQuery}&z=12&output=embed`;
const MAP_OPEN = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

export default function NzulezuPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PhotoHero
        photo={photos.villageRow}
        eyebrow="Western Region, Ghana"
        title="Nzulezu, the village on stilts"
        intro="How to reach Ghana’s stilt village on Lake Tadane, what to expect when you arrive, and where to stay nearby."
      />

      <section className="py-16 md:py-20">
        <Container>
          <dl className="mx-auto grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="border-t border-gray-light pt-4">
                <dt className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
                  {f.label}
                </dt>
                <dd className="mt-2 font-body text-body font-light leading-relaxed text-black">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section
        eyebrow="The village"
        title="A whole community built on water"
        tinted
        photo={photos.boardwalk}
      >
        <p>
          Nzulezu stands on wooden stilts and platforms over Lake Tadane, deep in
          the Amansuri wetland, one of the largest stretches of freshwater swamp
          forest in Ghana. Homes, a church and a school line a single long
          boardwalk that serves as the village&rsquo;s main street, and every
          journey in or out is made by canoe.
        </p>
        <p>
          Local tradition holds that the founders came from Oualata, a city of
          the ancient Ghana Empire, and that a snail led them to the lake. They
          built over the water for safety in times of war, and the lake is still
          seen as the village&rsquo;s protector. More than 500 people live here
          today, farming, fishing and distilling akpeteshi, a local palm spirit.
        </p>
        <p>
          The community&rsquo;s customs centre on the lake. Thursday is its
          sacred day, set aside from work on the water. In 2000 Ghana placed
          Nzulezu on UNESCO&rsquo;s World Heritage Tentative List as one of the
          few stilt settlements of its kind still lived in.
        </p>
      </Section>

      <Section
        eyebrow="Getting there"
        title="How to get to Nzulezu"
        photo={photos.raffiaWetland}
      >
        <p>
          <strong className="font-medium text-black">From Accra.</strong> Nzulezu
          is about 316 km west of Accra. By road, along the coastal highway
          through Takoradi to Beyin, the trip usually takes five to seven hours.
          To save most of the drive, fly from Accra to Takoradi (about 40
          minutes) and cover the last 90 km or so by car.
        </p>
        <p>
          <strong className="font-medium text-black">From Takoradi.</strong>{" "}
          Beyin is about 90 km to the west. Drive, or take a tro-tro from
          Takoradi to Beyin.
        </p>
        <p>
          <strong className="font-medium text-black">From Beyin.</strong> The
          canoe ride to the village takes about an hour. It follows narrow
          channels through raffia palms and swamp forest before opening onto
          Lake Tadane. Canoes leave as they fill, so arrive early.
        </p>
      </Section>

      <section className="pb-20 md:pb-28">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-heading text-h3 font-light">Nzulezu on the map</h2>
            <p className="mt-3 max-w-2xl font-body text-body font-light leading-relaxed text-gray">
              The village sits on Lake Tadane, inland from the coast at Beyin,
              close to Ghana&rsquo;s border with C&ocirc;te d&rsquo;Ivoire.
            </p>
            <div className="mt-8 aspect-[4/3] overflow-hidden rounded-sm border border-gray-light bg-gray-light md:aspect-[16/9]">
              <iframe
                src={MAP_EMBED}
                title="Map showing Nzulezu stilt village on Lake Tadane, Western Region, Ghana"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-body text-small">
              <a
                href={MAP_DIRECTIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline underline-offset-4"
              >
                Directions in Google Maps
              </a>
              <a
                href={MAP_OPEN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline underline-offset-4"
              >
                Open the map
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Plan your visit"
        title="Before you go"
        tinted
        photo={photos.canoeArrival}
      >
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="font-medium text-black">Go early.</strong> Morning
            canoes mean shorter waits at Beyin and cooler hours on the water.
          </li>
          <li>
            <strong className="font-medium text-black">Avoid Thursdays</strong>{" "}
            unless you have confirmed a visit; it is the lake&rsquo;s sacred day.
          </li>
          <li>
            <strong className="font-medium text-black">Carry cedis.</strong>{" "}
            Visitor fees are paid locally and support the community. Rates
            change, so ask us for the current figure when you plan your stay.
          </li>
          <li>
            <strong className="font-medium text-black">Pack for the water.</strong>{" "}
            Sun protection, drinking water, insect repellent and a dry bag for
            your phone and camera. Ask your doctor about malaria precautions
            before travelling to the region.
          </li>
          <li>
            <strong className="font-medium text-black">Ask before photographing
            people.</strong> Nzulezu is a home first and a sight second.
          </li>
          <li>
            <strong className="font-medium text-black">Choose the dry season</strong>{" "}
            if you can. November to March is the most comfortable time on the
            coast.
          </li>
        </ul>
      </Section>

      <Gallery title="Life on Lake Tadane" photos={galleryPhotos} />

      <VillaStay
        eyebrow="Where to stay near Nzulezu"
        title="Wake up on the water in Beyin"
        body="Aracuya is a three-bedroom over-water villa in Beyin, where the canoe trip to Nzulezu begins. Stay the night before and you can be on the water first thing, then come back to your own deck over the water instead of a long drive back to Accra."
        placeName="Nzulezu"
      />

      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Questions
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Visiting Nzulezu: common questions
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
            <p className="mt-10 font-body text-small font-light text-gray">
              Planning the rest of your trip? See{" "}
              <Link href="/rooms" className="text-green underline underline-offset-4">
                the villa
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-green underline underline-offset-4">
                get in touch
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <MoreOnNzulezu current="/nzulezu" />

      <ContactCTA />
    </>
  );
}
