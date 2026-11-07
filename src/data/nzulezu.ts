// Photos of Nzulezu from Wikimedia Commons. Every one is CC BY or CC BY-SA,
// which requires a visible credit naming the author and linking the licence;
// <PhotoCredit> renders it. Files were resized to 1600px wide, unaltered
// otherwise. Swap in Aracuya's own photos as they exist and drop the credit.

export interface NzulezuPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const BY_SA_4 = {
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
};

export const NZULEZU_COORDS = { lat: 5.020556, lng: -2.597778 };

export const photos = {
  villageRow: {
    src: "/images/nzulezu/village-row.jpg",
    alt: "A row of wooden houses on stilts at Nzulezu, standing over Lake Tadane",
    width: 1600,
    height: 1066,
    author: "KwesiRaul",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo_village_1.jpg",
  },
  boardwalk: {
    src: "/images/nzulezu/boardwalk.jpg",
    alt: "The wooden boardwalk that serves as Nzulezu's main street, lined with houses",
    width: 1600,
    height: 1066,
    author: "Kwameghana",
    ...BY_SA_4,
    source:
      "https://commons.wikimedia.org/wiki/File:A_family_at_hone_in_the_Nzulenzu_community.jpg",
  },
  canoeArrival: {
    src: "/images/nzulezu/canoe-arrival.jpg",
    alt: "A canoe paddled across Lake Tadane toward the stilt houses of Nzulezu",
    width: 1600,
    height: 1066,
    author: "KwesiRaul",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo_village_4.jpg",
  },
  raffiaWetland: {
    src: "/images/nzulezu/raffia-wetland.jpg",
    alt: "Raffia palms and swamp forest along the water in the Amansuri wetland",
    width: 1600,
    height: 1064,
    author: "Joy Agyepong",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo_11_-_Ghana.jpg",
  },
  stiltHousesCanoes: {
    src: "/images/nzulezu/stilt-houses-canoes.jpg",
    alt: "Stilt houses at Nzulezu with canoes moored beneath them",
    width: 1600,
    height: 1066,
    author: "KwesiRaul",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo-2.jpg",
  },
  housesOnWater: {
    src: "/images/nzulezu/houses-on-water.jpg",
    alt: "Painted houses raised on stilts over the still water at Nzulezu",
    width: 1600,
    height: 1066,
    author: "Kwameghana",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Bamboo_houses_on_water.jpg",
  },
  boardwalkLilies: {
    src: "/images/nzulezu/boardwalk-lilies.jpg",
    alt: "A wooden walkway at Nzulezu above water lilies on the lake",
    width: 1600,
    height: 1066,
    author: "Rachel Zack",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "https://commons.wikimedia.org/wiki/File:Rachel_Zack_Nzulezo_B1_B006.jpg",
  },
  greenHouse: {
    src: "/images/nzulezu/green-house.jpg",
    alt: "A green-painted wooden house on stilts at Nzulezu",
    width: 1600,
    height: 1376,
    author: "Prof OJ",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Wooden_house_on_stilts_village.jpg",
  },
  villageLake: {
    src: "/images/nzulezu/village-lake.jpg",
    alt: "Nzulezu seen from the lake, its houses and platforms raised above the water",
    width: 1600,
    height: 1125,
    author: "Luke Bosman",
    license: "CC BY-SA 1.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/1.0/",
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo_stilt_village.jpg",
  },
  amansuriWetland: {
    src: "/images/nzulezu/amansuri-wetland.jpg",
    alt: "Open water and reeds in the Amansuri wetland on the way to Nzulezu",
    width: 1600,
    height: 1064,
    author: "Joy Agyepong",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Nzulezo_4_-_Ghana.jpg",
  },
} satisfies Record<string, NzulezuPhoto>;

export const galleryPhotos: NzulezuPhoto[] = [
  photos.stiltHousesCanoes,
  photos.boardwalkLilies,
  photos.housesOnWater,
  photos.greenHouse,
  photos.villageLake,
  photos.amansuriWetland,
];
