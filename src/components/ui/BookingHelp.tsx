import { cn } from "@/lib/utils";

/** "If you have any issues, send us a message on WhatsApp." */
export function BookingHelp({ href, isDark }: { href: string; isDark: boolean }) {
  return (
    <p className={cn("mt-4 text-center font-body text-xs", isDark ? "text-cream/50" : "text-gray")}>
      If you have any issues,{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("underline underline-offset-2", isDark ? "text-cream/80 hover:text-cream" : "text-green")}
      >
        send us a message on WhatsApp
      </a>
      .
    </p>
  );
}
