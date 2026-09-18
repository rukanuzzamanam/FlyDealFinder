import type { Metadata } from "next";
import { RouteLandingPage } from "@/components/RouteLandingPage";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Sydney to Bangkok Flights — Cheap SYD to BKK Fares",
  description:
    "Compare cheap flights from Sydney (SYD) to Bangkok (BKK). Flight time, direct options, airlines, and recently checked fares.",
  alternates: { canonical: "/sydney-to-bangkok-flights" },
};

export default function Page() {
  return (
    <RouteLandingPage
      origin={{ code: "SYD", city: "Sydney" }}
      destination={{ code: "BKK", city: "Bangkok", country: "Thailand", emoji: "🛕" }}
      canonicalPath="/sydney-to-bangkok-flights"
      intro="Bangkok is a gateway to Southeast Asia and a consistently affordable long-haul option from Sydney, landing at Suvarnabhumi Airport (BKK) after around 9 hours direct."
      relatedDestinationCodes={["DPS", "HKT", "KUL", "SGN"]}
      faq={[
        {
          question: "How long is the flight from Sydney to Bangkok?",
          answer:
            "A direct Sydney to Bangkok flight typically takes around 9 hours. See the live search above for exact durations on your travel dates.",
        },
        {
          question: "Are Sydney to Bangkok flights usually direct?",
          answer:
            "Several airlines fly direct between Sydney and Bangkok. The live search above shows whether direct flights are currently available and their price versus one-stop options.",
        },
        {
          question: "What's the best time of year to fly to Bangkok?",
          answer:
            "Fares and weather both vary by season. Use flexible dates in the search above to compare prices across different weeks.",
        },
      ]}
    />
  );
}
