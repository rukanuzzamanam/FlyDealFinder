import type { Metadata } from "next";
import { RouteLandingPage } from "@/components/RouteLandingPage";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Sydney to Bali Flights — Cheap SYD to DPS Fares",
  description:
    "Compare cheap flights from Sydney (SYD) to Bali (DPS). Flight time, direct options, airlines, and live fares.",
  alternates: { canonical: "/sydney-to-bali-flights" },
};

export default function Page() {
  return (
    <RouteLandingPage
      origin={{ code: "SYD", city: "Sydney" }}
      destination={{ code: "DPS", city: "Bali", country: "Indonesia", emoji: "🌴" }}
      canonicalPath="/sydney-to-bali-flights"
      intro="Bali is one of the most popular warm-weather escapes for Sydney travelers — a direct flight gets you to Ngurah Rai International Airport (DPS) in around 6 hours."
      relatedDestinationCodes={["BKK", "SIN", "MNL", "HKT"]}
      faq={[
        {
          question: "How long is the flight from Sydney to Bali?",
          answer:
            "A direct Sydney to Bali flight typically takes around 6 hours, depending on the airline and winds. Check the live search above for current flight times.",
        },
        {
          question: "Are there direct flights from Sydney to Bali?",
          answer:
            "Yes, several airlines operate direct Sydney to Bali flights. The live search above shows whether direct options are currently available for your dates.",
        },
        {
          question: "What's the best time to book Sydney to Bali flights?",
          answer:
            "Fares vary by season and how far ahead you book. Use flexible dates in the search above, or set a price alert to get notified when fares drop.",
        },
      ]}
    />
  );
}
