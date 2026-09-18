/**
 * Explicit booking state shown to the user — never let a user believe a
 * fake/inactive booking link is real (see AGENTS.md section 3).
 *
 * - "live": a real, bookable checkout session was created.
 * - "test": a real checkout session was created against a sandbox/test
 *   account — clearly labeled as a test booking in the UI.
 * - "unavailable": no commercial booking integration is configured yet.
 */
export type BookingMode = "live" | "test" | "unavailable";

export interface BookingSessionParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}

export interface BookingSession {
  mode: BookingMode;
  /** Present only when mode is "live" or "test". */
  url?: string;
  provider: string;
}

/**
 * Abstraction over "how a user actually completes a booking", kept separate
 * from `FlightProvider` (which only searches). This is what lets the UI
 * (`FlightCard`) stay agnostic to whether booking happens via Duffel Links,
 * a future direct Duffel Orders integration, or an affiliate provider.
 */
export interface BookingProvider {
  readonly name: string;
  createBookingSession(params: BookingSessionParams): Promise<BookingSession>;
}
