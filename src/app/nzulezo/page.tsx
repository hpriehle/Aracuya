import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { photos } from "@/data/nzulezu";
import { ContactCTA } from "@/components/sections/home/ContactCTA";
import {
  Gallery,
  MoreOnNzulezu,
  PhotoHero,
  Section,
  VillaStay,
} from "@/components/sections/nzulezu/GuideParts";

// The history page, written with the "Nzulezo" spelling (Wikipedia's) so it
// can rank for people who search that way. /nzulezu is the visitor's guide
// and /nzulenzu the day plan; each has content the others do not.

const TITLE = "Nzulezo: The History of Ghana's Stilt Village on Lake Tadane";
const DESCRIPTION =
  "The story of Nzulezo, Ghana's village on stilts: the founding legend, how the houses and boardwalk are built, life and customs on Lake Tadane, and its place on UNESCO's Tentative List.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/nzulezo" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/nzulezo",
    type: "article",
    images: [{ url: photos.villageWide.src, alt: photos.villageWide.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [photos.villageWide.src],
  },
};

const faqs: { q: string; a: string }[] = [
  {
    q: "Who founded Nzulezo?",
    a: "According to local tradition, the founders came from Oualata (Walata), a city of the ancient Ghana Empire in what is now Mauritania, and followed a snail to Lake Tadane, where they settled on the water.",
  },
  {
    q: "How old is Nzulezo?",
    a: "Several centuries. The Ghana Tourism Authority describes it as a settlement of about 400 years; other accounts put it older. There is no written record of the founding, so the date rests on oral history.",
  },
  {
    q: "Why was Nzulezo built on water?",
    a: "For protection. Building over the lake made the village easier to defend in times of war, and the community still regards the lake as its protector, including against fire.",
  },
  {
    q: "What are Nzulezo's houses made of?",
    a: "Raffia palm sticks and other natural materials from the surrounding wetland, raised on stilts. Newer houses mix sawn timber with raffia palm, and some now have paint and glass windows.",
  },
  {
    q: "What does Nzulezo mean?",
    a: "“Surface of the water” in Nzema, the language of this part of Ghana’s Western Region. The village is also written Nzulezu and Nzulenzu.",
  },
  {
    q: "Is Nzulezo a UNESCO World Heritage Site?",
    a: "It is on UNESCO's World Heritage Tentative List, added in 2000 in the cultural category. That is the list of places a country intends to nominate; Nzulezo has not been inscribed as a World Heritage Site.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Nzulezo: the history of Ghana's stilt village",
      description: DESCRIPTION,
      url: "https://aracuya.com/nzulezo",
      image: `https://aracuya.com${photos.villageWide.src}`,
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

export default function NzulezoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PhotoHero
        photo={photos.villageWide}
        eyebrow="History and heritage"
        title="Nzulezo, a village built on water"
        intro="How a community came to live on stilts over Lake Tadane, how its houses are made, and the customs that still shape life on the lake."
      />

      <Section eyebrow="The name" title="“The surface of the water”">
        <p>
          Nzulezo takes its name from Nzema, the language of this corner of
          Ghana&rsquo;s Western Region, where it means &ldquo;surface of the
          water.&rdquo; It is an exact description: the whole village stands on
          stilts and platforms over Lake Tadane, inside the Amansuri wetland
          near Beyin, close to the border with C&ocirc;te d&rsquo;Ivoire.
        </p>
        <p>
          You will find the name written three ways. Nzulezo is the spelling
          Wikipedia uses; Nzulezu is the one most people search for; Nzulenzu
          turns up often too. All three are the same village.
        </p>
      </Section>

      <Section
        eyebrow="Origins"
        title="Following a snail to Lake Tadane"
        tinted
        photo={photos.villageEarly}
      >
        <p>
          Nzulezo&rsquo;s founding is held in oral tradition rather than written
          record. The story told in the village is that its ancestors came from
          Oualata, also written Walata, a city of the ancient Ghana Empire that
          now lies in Mauritania, and that a snail led them south to the lake.
        </p>
        <p>
          They built over the water for safety. A village on stilts in the
          middle of a lake was far easier to defend in times of war than one
          on open land, and the lake is still seen as the village&rsquo;s
          protector, a guard against disasters such as fire.
        </p>
        <p>
          How long ago that was is uncertain. The Ghana Tourism Authority puts
          the settlement at around 400 years old, and other accounts reach
          further back. What is certain is that people have lived on this lake,
          in this way, for centuries.
        </p>
      </Section>

      <Section
        eyebrow="How it is built"
        title="Raffia palm, timber and one long street"
        photo={photos.mainStreetEarly}
      >
        <p>
          The village is laid out along a single long boardwalk that residents
          call Main Street. Homes line one side. The school, a community centre
          and small businesses line the other. Every house, walkway and platform
          stands on stilts driven into the lakebed.
        </p>
        <p>
          The traditional building material is raffia palm, cut as sticks from
          the swamp forest around the lake, along with other materials the
          wetland provides. Building has long been collective work, and the
          skills involved, from joining the foundation pillars to the floors to
          lashing the boardwalks with natural rope fibre, are now documented by
          heritage researchers as an endangered craft.
        </p>
        <p>
          Newer houses mix sawn timber with raffia palm, and paint and glass
          windows have arrived, so the village today shows both the old way of
          building and the new side by side.
        </p>
      </Section>

      <Section
        eyebrow="Life on the lake"
        title="A community that lives on the water"
        tinted
        photo={photos.stiltHome}
      >
        <p>
          Daily life at Nzulezo happens over the lake. Meals are cooked and fufu
          is pounded on the platforms; children go to school, families worship,
          and baptisms and burials all take place on the water. Getting
          anywhere, to farm, to fish or to reach Beyin, means a canoe.
        </p>
        <p>
          The lake is also at the centre of the village&rsquo;s customs.
          Thursday is its sacred day, set aside from strenuous work on the
          water. Farming on nearby land is the main livelihood, with fishing,
          the distilling of akpeteshi, a local spirit, and visitors adding to
          it.
        </p>
      </Section>

      <Section eyebrow="Heritage" title="On UNESCO's Tentative List">
        <p>
          In 2000 Ghana added Nzulezo to its UNESCO World Heritage Tentative
          List, in the cultural category, as one of the few stilt and platform
          settlements of its kind still lived in, and for the traditions bound up
          with its lake.
        </p>
        <p>
          A Tentative List entry is the first step: it marks a place a country
          intends to nominate. Nzulezo has not been inscribed as a World
          Heritage Site, but its listing is part of why the village draws
          visitors from across Ghana and beyond.
        </p>
      </Section>

      <Section
        eyebrow="The setting"
        title="The Amansuri wetland"
        tinted
        photo={photos.wetlandReeds}
      >
        <p>
          The lake sits inside the Amansuri wetland, described by the Ghana
          Tourism Authority as the largest inland swamp forest in Ghana and
          designated an Important Bird Area. The canoe route to the village
          winds through narrow channels and open plains before reaching the
          lake, and egrets, herons and kingfishers are often seen along the
          way.
        </p>
      </Section>

      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Questions
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">
              Nzulezo&rsquo;s history: common questions
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
        title="Nzulezo today"
        photos={[photos.paintedHouse, photos.stiltHousesCanoes, photos.boardwalkLilies]}
      />

      <VillaStay
        eyebrow="Visiting Nzulezo"
        title="See it for yourself, and stay on the water too"
        body="Aracuya is a three-bedroom over-water villa in Beyin, where the canoe to Nzulezo leaves. Spend the night and you can reach the village in the cool of the morning, then return to a house on stilts of your own."
        placeName="Nzulezo"
      />

      <MoreOnNzulezu current="/nzulezo" />

      <ContactCTA />
    </>
  );
}
