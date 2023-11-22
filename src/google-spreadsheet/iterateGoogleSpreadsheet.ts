import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { DateTime, Duration } from "luxon";
import { IterateSpreadsheetCallback } from "../types/GoogleSpreadsheet";
import { SheetDurationStatus } from "../types/Subscription";
import { serialDateToJSDate } from "../utils/serialDateToJsDate";

/**
 * The `iterateGoogleSpreadsheet` function iterates through a Google Spreadsheet, parses the values of
 * the id, date and duration columns, and calls a callback function with the parsed values.
 * @param {GoogleSpreadsheetWorksheet} sheet - The `sheet` parameter is a Google Spreadsheet worksheet
 * object. It represents a specific sheet within a Google Spreadsheet and contains methods and
 * properties for accessing and manipulating the data in that sheet.
 * @param {IterateSpreadsheetCallback} callback - The `callback` parameter is a function that will be
 * called for each row in the Google Spreadsheet.
 */
export function iterateGoogleSpreadsheet(sheet: GoogleSpreadsheetWorksheet, callback: IterateSpreadsheetCallback) {
  // Column indices in google spreadsheet. First column is id, seconds is date float value.
  const columnIndex = {
    id: 0,
    date: 1,
    duration: 2,
  };

  // Initialize `row` with first row in the sheet.
  let row = {
    id: sheet.getCell(0, columnIndex.id).value,
    date: sheet.getCell(0, columnIndex.date).value,
    duration: sheet.getCell(0, columnIndex.duration).value,
  };

  // Initialize `rowIndex` with -1, because it will be incremented immediately in loop.
  // So `rowIndex++` can be placed on top of `while` loop without repeating in all `continue` parts.
  let rowIndex = -1;

  // Run loop while row and date not null or undefined.
  while (row.id ?? row.date) {
    // Increment `rowIndex` -> going to the next row in the sheet.
    // First iteration -> -1 + 1 -> first (rowIndex === 0) row.
    rowIndex++;

    // Store cell values for id, date and duration.
    row = {
      id: sheet.getCell(rowIndex, columnIndex.id).value,
      date: sheet.getCell(rowIndex, columnIndex.date).value,
      duration: sheet.getCell(rowIndex, columnIndex.duration).value,
    };

    // `cell.value` may be different things so we need to make sure it is string or number, then call `.toString()`.

    // Skip row, if id or date is falsy.
    if (!row.id || !row.date) continue;

    // Skip row, if id or date is not `string` and is not `number`.
    if (
      (typeof row.id !== "number" && typeof row.id !== "string") ||
      (typeof row.date !== "number" && typeof row.date !== "string")
    )
      continue;

    let duration: Duration | SheetDurationStatus = SheetDurationStatus.DEFAULT;

    // Parse duration.
    // If duration for subscription is present in row.
    if (typeof row.duration === "number" || typeof row.duration === "string") {
      // Duration from table to string.
      const tableDurationString = row.duration.toString();

      // Float value from string.
      const durationParsed = parseFloat(tableDurationString);

      // If parsed value is not float.
      if (isNaN(durationParsed)) {
        // Parsed value NaN here -> duration string is not number in table.

        // If duration is "Б" it is infinite, else 30 days.
        duration = tableDurationString === "Б" ? SheetDurationStatus.INFINITE : SheetDurationStatus.DEFAULT;
      } else {
        // Duration is float number of month.
        // Create Duration (Luxon) object from millisInMonth * float value duration
        const millisIn30Days = 2592000000; // 30d * 24h * 60m * 60s * 1000millis = 2592000000 millis in 30 days

        duration = Duration.fromMillis(durationParsed * millisIn30Days);
      }
    } else {
      // If duration in table is not number or string.
      duration = SheetDurationStatus.DEFAULT;
    }

    // Transform id and date to strings, then parse id as int, parse date as float.
    // Duration is already transformed so we just store it here.
    const parsedNumbers = {
      id: parseInt(row.id.toString()),
      date: parseFloat(row.date.toString()),
      duration: duration,
    };

    // Skip row, if parsed id or parsed date isNaN.
    if (isNaN(parsedNumbers.id) || isNaN(parsedNumbers.date)) continue;

    // parsedNumbers.id -> not NaN -> correctly parsed int from parseInt.
    // parsedNumber.date -> not NaN -> correctly parsed float from parseFloat.

    // Converts float number from google spreadsheet to JS Date object with time.
    const subscriptionDateJS = serialDateToJSDate(parsedNumbers.date);

    // Luxon DateTime object.
    const subscriptionDateLuxon = DateTime.fromJSDate(subscriptionDateJS).setZone("UTC+3");

    // Run callback function with correct values of id, date and duration.
    callback(
      {
        id: parsedNumbers.id,
        date: subscriptionDateLuxon,
        duration: duration,
      },
      {
        id: sheet.getCell(rowIndex, columnIndex.id),
        date: sheet.getCell(rowIndex, columnIndex.date),
        duration: sheet.getCell(rowIndex, columnIndex.duration),
      }
    );
  }
}
