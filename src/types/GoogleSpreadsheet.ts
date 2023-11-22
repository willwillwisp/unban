import { GoogleSpreadsheetCell } from "google-spreadsheet";
import { Subscription } from "./Subscription";

export interface CellData {
  id: GoogleSpreadsheetCell;
  date: GoogleSpreadsheetCell;
  duration: GoogleSpreadsheetCell;
}

export type IterateSpreadsheetCallback = (subscription: Subscription, cellData: CellData) => void;
