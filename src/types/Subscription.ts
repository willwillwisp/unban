import { DateTime, Duration } from "luxon";

/**
 * The third column in google spreadsheet is duration of subscription.
 * If it's "Б", then subscription should be infinite.
 * If it's float number, then subscription lasts <number in table> * 30 days.
 * If it's empty or any other value, subscription lasts 30 days.
 */
export const enum SheetDurationStatus {
  INFINITE = "Б",
  DEFAULT = 30,
}

export interface Subscription {
  id: number;
  date: DateTime;
  duration: Duration | SheetDurationStatus;
}

export type Subscribers = Subscription[][];
