import { z } from "zod";

const IATA_OR_CITY_CODE = /^[A-Za-z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [y, m, dd] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, dd));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === dd
  );
}

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

const dateField = z
  .string()
  .regex(DATE, "Date must be in YYYY-MM-DD format")
  .refine(isValidCalendarDate, "Not a valid calendar date")
  .refine((v) => v >= todayUtcDateString(), "Date cannot be in the past");

export const flightSearchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(IATA_OR_CITY_CODE, "Origin must be a 3-letter airport/city code"),
    destination: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^([A-Z]{3}|ANYWHERE)$/, "Destination must be a 3-letter code or ANYWHERE"),
    departureDate: dateField,
    returnDate: dateField.optional(),
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(8).default(0),
    cabinClass: z
      .enum(["economy", "premium_economy", "business", "first"])
      .default("economy"),
    maxPrice: z.coerce.number().positive().max(100000).optional(),
  })
  .refine(
    (v) => !v.returnDate || v.returnDate >= v.departureDate,
    { message: "Return date must be on or after the departure date", path: ["returnDate"] }
  )
  .refine((v) => v.origin !== v.destination, {
    message: "Origin and destination cannot be the same",
    path: ["destination"],
  });

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;

export const anywhereSearchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(IATA_OR_CITY_CODE, "Origin must be a 3-letter airport/city code"),
    departureDate: dateField,
    returnDate: dateField.optional(),
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(8).default(0),
    maximumPrice: z.coerce.number().positive().max(100000).optional(),
  })
  .refine(
    (v) => !v.returnDate || v.returnDate >= v.departureDate,
    { message: "Return date must be on or after the departure date", path: ["returnDate"] }
  );

export type AnywhereSearchInput = z.infer<typeof anywhereSearchSchema>;

export const priceAlertSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(IATA_OR_CITY_CODE, "Origin must be a 3-letter airport/city code"),
  destination: z
    .string()
    .trim()
    .toUpperCase()
    .regex(IATA_OR_CITY_CODE, "Destination must be a 3-letter airport/city code"),
  targetPrice: z.coerce.number().positive().max(100000),
  currency: z.string().trim().toUpperCase().length(3).default("AUD"),
  departureDate: dateField.optional(),
  returnDate: dateField.optional(),
});

export type PriceAlertInput = z.infer<typeof priceAlertSchema>;

export const NEWSLETTER_PREFERENCES = [
  "Australia",
  "Asia",
  "Europe",
  "USA",
  "Business Class",
  "Family Travel",
] as const;

export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  preferences: z.array(z.enum(NEWSLETTER_PREFERENCES)).default([]),
});

export type NewsletterSignupInput = z.infer<typeof newsletterSignupSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  // Honeypot field — real users never fill this in; bots that autofill every
  // field will, so a non-empty value is treated as spam (see /api/contact).
  companyWebsite: z.string().max(0, "Spam detected").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const bookingSessionSchema = z.object({
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(IATA_OR_CITY_CODE, "Origin must be a 3-letter airport/city code"),
  destination: z
    .string()
    .trim()
    .toUpperCase()
    .regex(IATA_OR_CITY_CODE, "Destination must be a 3-letter airport/city code"),
  departureDate: dateField,
  returnDate: dateField.optional(),
});

export type BookingSessionInput = z.infer<typeof bookingSessionSchema>;
