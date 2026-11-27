export const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Nzulezu", href: "/nzulezu" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// The Christmas strip in the header hides itself from this moment (Ghana is on UTC).
export const CHRISTMAS_ENDS = new Date("2027-01-04T00:00:00Z");
export const isChristmasSeason = (now = new Date()) => now < CHRISTMAS_ENDS;
