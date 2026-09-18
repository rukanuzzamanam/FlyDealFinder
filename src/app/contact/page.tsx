import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the FlyDealFinder team.",
};

export default function ContactPage() {
  const contactEmail = process.env.CONTACT_EMAIL;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Contact Us</h1>
      <p className="mb-8 text-sm text-slate-600 dark:text-slate-300">
        Questions, feedback, or found a bug? Send us a message and we&apos;ll get back to you.
        {contactEmail && (
          <>
            {" "}
            You can also email us directly at{" "}
            <a href={`mailto:${contactEmail}`} className="text-brand underline">
              {contactEmail}
            </a>
            .
          </>
        )}
      </p>
      <ContactForm />
    </div>
  );
}
