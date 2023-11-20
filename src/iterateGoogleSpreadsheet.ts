import { GoogleSpreadsheetCell, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { DateTime } from "luxon";

/**
 * The `iterateGoogleSpreadsheet` function iterates over rows in a Google Spreadsheet, parses the
 * values in id and date columns, and passes them to a callback function. Id and date are validated
 * and transformed to number and DateTime (Luxon) respectively.
 * @param {GoogleSpreadsheetWorksheet} sheet - The `sheet` parameter is the Google Spreadsheet
 * worksheet that you want to iterate over.
 * @param callback - The `callback` parameter in the `iterateGoogleSpreadsheet` function is a callback function that takes
 * four arguments: `id`, `date`, `idCell`, and `dateCell`.
 */
export function iterateGoogleSpreadsheet(
  sheet: GoogleSpreadsheetWorksheet,
  callback: (id: number, date: DateTime, idCell: GoogleSpreadsheetCell, dateCell: GoogleSpreadsheetCell) => void
) {
  // Column indices in google spreadsheet. First column is id, seconds is date float value.
  const columnIndex = {
    id: 0,
    date: 1,
  };

  // Initialize `row` with first row in the sheet.
  let row = {
    id: sheet.getCell(0, columnIndex.id).value,
    date: sheet.getCell(0, columnIndex.date).value,
  };

  // Initialize `rowIndex` with -1, because it will be incremented immediately in loop.
  // So `rowIndex++` can be placed on top of `while` loop without repeating in all `continue` parts.
  let rowIndex = -1;

  // Run loop while row and date not null or undefined.
  while (row.id ?? row.date) {
    // Increment `rowIndex` -> going to the next row in the sheet.
    // First iteration -> -1 + 1 -> first (rowIndex === 0) row.
    rowIndex++;

    // Store cell values for id and date.
    row = {
      id: sheet.getCell(rowIndex, columnIndex.id).value,
      date: sheet.getCell(rowIndex, columnIndex.date).value,
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

    // Transform id and date to strings, then parse id as int, parse date as float.
    const parsedNumbers = {
      id: parseInt(row.id.toString()),
      date: parseFloat(row.date.toString()),
    };

    // Skip row, if parsed id or parsed date isNaN.
    if (isNaN(parsedNumbers.id) || isNaN(parsedNumbers.date)) continue;

    // parsedNumbers.id -> not NaN -> correctly parsed int from parseInt.
    // parsedNumber.date -> not NaN -> correctly parsed float from parseFloat.

    // Converts float number from google spreadsheet to JS Date objects.
    const subscriptionDateJS = new Date(Date.UTC(0, 0, parsedNumbers.date - 1));

    // Luxon DateTime object.
    const subscriptionDateLuxon = DateTime.fromJSDate(subscriptionDateJS);

    // Run callback function with correct values of id and date.
    callback(
      parsedNumbers.id,
      subscriptionDateLuxon,
      sheet.getCell(rowIndex, columnIndex.id),
      sheet.getCell(rowIndex, columnIndex.date)
    );
  }
}
