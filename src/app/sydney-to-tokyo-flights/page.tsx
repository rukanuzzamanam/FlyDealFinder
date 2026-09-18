import type { Metadata } from "next";
import { RouteLandingPage } from "@/components/RouteLandingPage";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Sydney to Tokyo Flights — Cheap SYD to NRT Fares",
  description:
    "Compare cheap flights from Sydney (SYD) to Tokyo (NRT). Flight time, direct options, airlines, and recently checked fares.",
  alternates: { canonical: "/sydney-to-tokyo-flights" },
};

export default function Page() {
  return (
    <RouteLandingPage
      origin={{ code: "SYD", city: "Sydney" }}
      destination={{ code: "NRT", city: "Tokyo", country: "Japan", emoji: "🗼" }}
      canonicalPath="/sydney-to-tokyo-flights"
      intro="Tokyo is a long-haul favorite from Sydney, combining big-city sights with easy access to the rest of Japan. Flights land at Narita International Airport (NRT), around 9-10 hours from Sydney."
      relatedDestinationCodes={["KIX", "ICN", "TPE", "HKG"]}
      faq={[
        {
          question: "How long is the flight from Sydney to Tokyo?",
          answer:
            "A direct Sydney to Tokyo flight is typically around 9-10 hours. Check the live search above for exact times on your dates.",
        },
        {
          question: "Which airport does Sydney to Tokyo land at?",
          answer:
            "Most flights land at Narita International Airport (NRT); some services may use Haneda (HND) — check your specific flight's details before booking.",
        },
        {
          question: "Is it cheaper to fly to Tokyo with a stopover?",
          answer:
            "Sometimes — one-stop itineraries via other Asian hubs can be cheaper than direct flights. Compare both using the live search above.",
        },
      ]}
    />
  );
}
