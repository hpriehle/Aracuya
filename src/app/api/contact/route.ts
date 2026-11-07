import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ghlConfigured, upsertGhlLead } from '@/lib/ghl';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimit.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  rateLimit.set(ip, timestamps);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Lead {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

async function sendEmail({ name, email, phone, subject, message }: Lead): Promise<string | undefined> {
  const { data, error } = await resend.emails.send({
    from: 'Aracuya Contact Form <onboarding@resend.dev>',
    to: 'harrison@riehle.co',
    replyTo: email,
    subject: `[Aracuya Contact] ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `,
  });
  if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
  return data?.id;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      console.log('[Contact API] Rate limited:', ip);
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message, _company, _t } = body;

    // Honeypot check — bots fill hidden fields
    if (_company) {
      console.log('[Contact API] Honeypot triggered, rejecting');
      // Return success to not tip off bots
      return NextResponse.json({ success: true });
    }

    // Time-based check — reject if submitted faster than 3 seconds
    const submittedAt = parseInt(_t, 10);
    if (!submittedAt || Date.now() - submittedAt < 3000) {
      console.log('[Contact API] Too fast, likely bot');
      return NextResponse.json({ success: true });
    }

    // Validate required inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    // Basic content validation — reject if name/message look like random strings
    const looksRandom = (s: string) => /^[a-zA-Z]{15,}$/.test(s.trim());
    if (looksRandom(name) || looksRandom(message)) {
      console.log('[Contact API] Random-looking content, rejecting');
      return NextResponse.json({ success: true });
    }

    const lead = { name, email, phone, subject, message };

    // GoHighLevel is the record of every enquiry; the email is the alert.
    // Both run, and the visitor only sees an error if both fail.
    const [ghl, mail] = await Promise.allSettled([
      ghlConfigured()
        ? upsertGhlLead({
            name,
            email,
            phone,
            source: 'aracuya.com contact form',
            tags: ['website contact form'],
            note: `Contact form: ${subject}\n\n${message}`,
          })
        : Promise.reject(new Error('GHL_API_TOKEN / GHL_LOCATION_ID not set')),
      sendEmail(lead),
    ]);

    if (ghl.status === 'fulfilled') {
      console.log('[Contact API] GHL contact upserted:', ghl.value);
    } else {
      console.error('[Contact API] GHL failed:', ghl.reason);
    }
    if (mail.status === 'fulfilled') {
      console.log('[Contact API] Email sent:', mail.value);
    } else {
      console.error('[Contact API] Email failed:', mail.reason);
    }

    if (ghl.status === 'rejected' && mail.status === 'rejected') {
      // Last resort so the enquiry isn't lost: Netlify keeps logs for 24 hours.
      console.error('[Contact API] UNDELIVERED SUBMISSION:', JSON.stringify(lead));
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
