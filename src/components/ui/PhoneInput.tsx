"use client";

import { useMemo, useState } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { cn } from "@/lib/utils";

/** Regional-indicator emoji flag for an ISO 3166 country code. */
export function flagEmoji(country: string): string {
  return String.fromCodePoint(...[...country.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

/** The visitor's country from their browser language (en-US → US), if we know it. */
function guessCountry(fallback: CountryCode): CountryCode {
  if (typeof navigator === "undefined") return fallback;
  const known = new Set<string>(getCountries());
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split("-")[1]?.toUpperCase();
    if (region && known.has(region)) return region as CountryCode;
  }
  return fallback;
}

interface PhoneInputProps {
  /** Full number in international form, e.g. "+233 24 123 4567". */
  onChange: (value: string) => void;
  inputClassName: string;
  isDark: boolean;
  defaultCountry?: CountryCode;
  /** Lock the country (e.g. MTN MoMo is Ghana-only). */
  fixedCountry?: CountryCode;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}

/**
 * A country picker (flag + dial code) beside the local number. The picker is
 * a native <select> laid invisibly over the flag, so phones get their own
 * scrolling list and it stays accessible.
 */
export function PhoneInput({
  onChange,
  inputClassName,
  isDark,
  defaultCountry = "GH",
  fixedCountry,
  required,
  placeholder,
  autoComplete = "tel-national",
  id,
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(() => fixedCountry ?? guessCountry(defaultCountry));
  const [national, setNational] = useState("");

  const options = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return getCountries()
      .map((c) => ({ code: c, name: names.of(c) ?? c, dial: getCountryCallingCode(c) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const dial = getCountryCallingCode(country);
  const emit = (c: CountryCode, n: string) => {
    const digits = n.replace(/\D/g, "");
    onChange(digits ? `+${getCountryCallingCode(c)} ${n.trim()}` : "");
  };

  const prefix = (
    <span className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-base leading-none">{flagEmoji(country)}</span>
      <span>+{dial}</span>
      {!fixedCountry && <span className={cn("text-[10px]", isDark ? "text-cream/50" : "text-gray")}>▾</span>}
    </span>
  );

  return (
    <div className="flex gap-2">
      <div className={cn(inputClassName.replace("w-full", ""), "relative flex shrink-0 items-center")}>
        {prefix}
        {!fixedCountry && (
          <select
            aria-label="Country code"
            className="absolute inset-0 cursor-pointer opacity-0 [&>option]:text-black"
            value={country}
            onChange={(e) => {
              const c = e.target.value as CountryCode;
              setCountry(c);
              emit(c, national);
            }}
          >
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {flagEmoji(o.code)} {o.name} +{o.dial}
              </option>
            ))}
          </select>
        )}
      </div>
      <input
        id={id}
        className={cn(inputClassName, "min-w-0 flex-1")}
        required={required}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={national}
        onChange={(e) => {
          setNational(e.target.value);
          emit(country, e.target.value);
        }}
      />
    </div>
  );
}
