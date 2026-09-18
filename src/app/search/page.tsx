import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";
import { LoadingState } from "@/components/LoadingState";

export const metadata: Metadata = {
  title: "Search Results",
  description: "Compare cheap flight deals and find the best fare for your trip.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Suspense fallback={<LoadingState />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
