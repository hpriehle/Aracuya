// MTN Mobile Money Collections (server-only). "Request to pay": MTN sends the
// guest a prompt on their phone and they approve it with their MoMo PIN.
// Docs: https://momodeveloper.mtn.com/api-documentation/collection/
//
// Env:
//   MOMO_ENVIRONMENT    sandbox | mtnghana   ("production" is accepted as mtnghana)
//   MOMO_COLLECTIONS_USER_ID, MOMO_COLLECTIONS_API_KEY, MOMO_COLLECTIONS_SUBSCRIPTION_KEY
//
// Sandbox: amounts are charged in EUR (MTN's sandbox only supports EUR) and
// these payer numbers simulate outcomes; any other number succeeds:
//   46733123450 FAILED · 46733123451 REJECTED · 46733123452 TIMEOUT
//   46733123453 stays PENDING

import { randomUUID } from "node:crypto";

export class MomoNotConfiguredError extends Error {
  constructor() {
    super("MTN MoMo is not configured");
  }
}

export function momoEnvironment(): "sandbox" | "mtnghana" {
  const env = process.env.MOMO_ENVIRONMENT ?? "sandbox";
  return env === "mtnghana" || env === "production" ? "mtnghana" : "sandbox";
}

export function isMomoSandbox(): boolean {
  return momoEnvironment() === "sandbox";
}

function getConfig() {
  const userId = process.env.MOMO_COLLECTIONS_USER_ID;
  const apiKey = process.env.MOMO_COLLECTIONS_API_KEY;
  const subscriptionKey = process.env.MOMO_COLLECTIONS_SUBSCRIPTION_KEY;
  if (!userId || !apiKey || !subscriptionKey) return null;
  return {
    userId,
    apiKey,
    subscriptionKey,
    baseUrl: isMomoSandbox()
      ? "https://sandbox.momodeveloper.mtn.com"
      : "https://proxy.momoapi.mtn.com",
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(config: NonNullable<ReturnType<typeof getConfig>>): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(`${config.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.userId}:${config.apiKey}`).toString("base64")}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`MoMo token request failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

/**
 * Normalise a Ghana mobile number to MSISDN form (233XXXXXXXXX).
 * In sandbox, MTN's simulated numbers (e.g. 46733123450) pass through.
 */
export function normalizeMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^233\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`;
  if (/^\d{9}$/.test(digits)) return `233${digits}`;
  if (isMomoSandbox()) {
    // MTN's test numbers typed after the widget's fixed +233 prefix.
    if (/^23346733\d{6}$/.test(digits)) return digits.slice(3);
    if (/^\d{8,15}$/.test(digits)) return digits;
  }
  return null;
}

/** MTN Ghana prefixes: 024, 025, 053, 054, 055, 059. */
export function isMtnGhanaNumber(msisdn: string): boolean {
  return /^233(24|25|53|54|55|59)\d{7}$/.test(msisdn);
}

function safeMessage(text: string): string {
  return text.replace(/[^A-Za-z0-9 -]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Ask MTN to prompt the payer. Returns the reference used to check status. */
export async function requestToPay(params: {
  amountGhs: number;
  msisdn: string;
  externalId: string;
  payerMessage: string;
  payeeNote: string;
  callbackUrl?: string;
}): Promise<string> {
  const config = getConfig();
  if (!config) throw new MomoNotConfiguredError();
  const token = await getToken(config);
  const body = JSON.stringify({
    amount: String(params.amountGhs),
    currency: isMomoSandbox() ? "EUR" : "GHS",
    externalId: params.externalId,
    payer: { partyIdType: "MSISDN", partyId: params.msisdn },
    // MTN shows these to the payer / on statements. Its firewall rejects
    // some punctuation (parentheses return an HTML "Request Rejected" page),
    // so send letters, digits, spaces and hyphens only.
    payerMessage: safeMessage(params.payerMessage),
    payeeNote: safeMessage(params.payeeNote),
  });

  // MTN only calls back to public https URLs whose host matches the
  // providerCallbackHost registered for the API user; any other host is
  // refused with INVALID_CALLBACK_URL_HOST. The callback is only a nudge
  // (the widget polls the status anyway), so on that error retry without it.
  const callbacks = params.callbackUrl?.startsWith("https://") ? [params.callbackUrl, undefined] : [undefined];
  for (const callbackUrl of callbacks) {
    const referenceId = randomUUID();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": momoEnvironment(),
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
    };
    if (callbackUrl) headers["X-Callback-Url"] = callbackUrl;

    const res = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    if (res.status === 202) return referenceId;
    const text = (await res.text()).slice(0, 200);
    if (callbackUrl && text.includes("INVALID_CALLBACK_URL_HOST")) {
      console.warn("[momo] callback host not registered with MTN; relying on status polling");
      continue;
    }
    throw new Error(`MoMo requesttopay failed: ${res.status} ${text}`);
  }
  throw new Error("MoMo requesttopay failed");
}

export interface MomoPaymentStatus {
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  reason?: string;
  financialTransactionId?: string;
  amount?: string;
  currency?: string;
}

/** The only source of truth for a MoMo payment: ask MTN directly. */
export async function getRequestToPayStatus(referenceId: string): Promise<MomoPaymentStatus> {
  const config = getConfig();
  if (!config) throw new MomoNotConfiguredError();
  const token = await getToken(config);
  const res = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": momoEnvironment(),
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`MoMo status check failed: ${res.status}`);
  // `reason` is a string in current MTN responses, an object in older ones.
  const data = (await res.json()) as Omit<MomoPaymentStatus, "reason"> & {
    reason?: string | { code?: string };
  };
  const reason = typeof data.reason === "object" ? data.reason?.code : data.reason;
  return { ...data, reason };
}

/** Plain-language reason for a failed MoMo payment. */
export function momoFailureMessage(reason?: string): string {
  switch (reason) {
    case "APPROVAL_REJECTED":
      return "The payment was declined on your phone. Nothing was charged.";
    case "EXPIRED":
      return "The payment request expired before it was approved. Nothing was charged.";
    case "NOT_ENOUGH_FUNDS":
      return "There wasn't enough money in the MoMo wallet. Nothing was charged.";
    case "PAYER_NOT_FOUND":
      return "That number doesn't have an MTN MoMo wallet.";
    case "PAYER_LIMIT_REACHED":
      return "That wallet has reached its MoMo limit. Nothing was charged.";
    default:
      return "The MoMo payment didn't go through. Nothing was charged.";
  }
}
