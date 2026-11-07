// GoHighLevel (LeadConnector) API v2 client, using a sub-account Private
// Integration token. Needs GHL_API_TOKEN and GHL_LOCATION_ID; the token needs
// the contacts.write and contacts.readonly scopes.

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

export interface GhlLead {
  name: string;
  email: string;
  phone?: string;
  source: string;
  tags: string[];
  note?: string;
}

export function ghlConfigured(): boolean {
  return Boolean(process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID);
}

async function ghlFetch(path: string, body: unknown): Promise<{ contact?: { id?: string } }> {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
      Version: GHL_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL ${path} failed: ${res.status} ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

/**
 * Creates the contact, or updates the existing one matched by email/phone,
 * then attaches the note. Returns the contact id.
 */
export async function upsertGhlLead(lead: GhlLead): Promise<string> {
  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const data = await ghlFetch('/contacts/upsert', {
    locationId: process.env.GHL_LOCATION_ID,
    firstName,
    lastName: rest.join(' ') || undefined,
    name: lead.name.trim(),
    email: lead.email.trim(),
    phone: lead.phone?.trim() || undefined,
    source: lead.source,
    tags: lead.tags,
  });

  const contactId: string | undefined = data?.contact?.id;
  if (!contactId) throw new Error('GHL upsert returned no contact id');

  if (lead.note) {
    await ghlFetch(`/contacts/${contactId}/notes`, { body: lead.note });
  }
  return contactId;
}
