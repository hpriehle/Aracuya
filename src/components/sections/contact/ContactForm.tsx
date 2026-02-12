"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          className="mt-2 w-full border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green"
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
          className="mt-2 w-full border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green"
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
          className="mt-2 w-full appearance-none border-b border-gray-light bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B6B6B%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_4px_center] bg-no-repeat px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green"
        >
          <option value="reservation">Reservation Inquiry</option>
          <option value="general">General Inquiry</option>
          <option value="events">Events</option>
          <option value="other">Other</option>
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
          className="mt-2 w-full resize-none border-b border-gray-light bg-transparent px-1 py-3 font-body text-body font-light text-black outline-none transition-colors focus:border-green"
        />
      </div>

      <div className="pt-4">
        <Button type="submit">Send Message</Button>
      </div>
    </form>
  );
}
