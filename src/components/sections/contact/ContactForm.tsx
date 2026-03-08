"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to send message. Please try emailing us directly.');
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-center">
        <div>
          <h3 className="font-heading text-h3 font-light">Thank you</h3>
          <p className="mt-3 font-body text-body font-light text-gray">
            We have received your message and will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block font-body text-xs font-medium uppercase tracking-widest text-black"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          required
          disabled={loading}
          className="mt-2 w-full border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block font-body text-xs font-medium uppercase tracking-widest text-black"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          required
          disabled={loading}
          className="mt-2 w-full border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block font-body text-xs font-medium uppercase tracking-widest text-black"
        >
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          disabled={loading}
          className="mt-2 w-full appearance-none border-b border-gray-light bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_4px_center] bg-no-repeat px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green disabled:opacity-50"
        >
          <option value="Reservation Inquiry">Reservation Inquiry</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Events">Events</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block font-body text-xs font-medium uppercase tracking-widest text-black"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          disabled={loading}
          className="mt-2 w-full resize-none border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green disabled:opacity-50"
        />
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  );
}
