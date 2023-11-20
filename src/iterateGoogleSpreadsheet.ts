import { GoogleSpreadsheetCell, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { DateTime } from "luxon";

/**
 * The `iterateGoogleSpreadsheet` function iterates over rows in a Google Spreadsheet, parses the
 * values in specific columns, and passes them to a callback function.
 * @param {GoogleSpreadsheetWorksheet} sheet - The `sheet` parameter is the Google Spreadsheet
 * worksheet that you want to iterate over.
 * @param iter - The `iter` parameter in the `iterateGoogleSpreadsheet` function is a callback function that takes
 * four arguments: `id`, `date`, `idCell`, and `dateCell`.
 */
export function iterateGoogleSpreadsheet(
  sheet: GoogleSpreadsheetWorksheet,
  iter: (id: number, date: DateTime, idCell: GoogleSpreadsheetCell, dateCell: GoogleSpreadsheetCell) => void
) {
  const columnIndex = {
    id: 0,
    date: 1,
  };

  let rowIndex = 0;

  let row = {
    id: sheet.getCell(rowIndex, columnIndex.id).value,
    date: sheet.getCell(rowIndex, columnIndex.date).value,
  };

  while (row.id ?? row.date) {
    console.log(rowIndex);

    /**
     * TODO: Refactor continue 
     */
    if (!row.id || !row.date) {
      rowIndex++;

      row = {
        id: sheet.getCell(rowIndex, columnIndex.id).value,
        date: sheet.getCell(rowIndex, columnIndex.date).value,
      };
      continue;
    }

    if (
      (typeof row.id !== "number" && typeof row.id !== "string") ||
      (typeof row.date !== "number" && typeof row.date !== "string")
    ) {
      rowIndex++;

      row = {
        id: sheet.getCell(rowIndex, columnIndex.id).value,
        date: sheet.getCell(rowIndex, columnIndex.date).value,
      };
      continue;
    }

    const parsedNumbers = {
      id: parseInt(row.id.toString()),
      date: parseFloat(row.date.toString()),
    };

    if (isNaN(parsedNumbers.id) || isNaN(parsedNumbers.date)) {
      rowIndex++;

      row = {
        id: sheet.getCell(rowIndex, columnIndex.id).value,
        date: sheet.getCell(rowIndex, columnIndex.date).value,
      };
      continue;
    }

    // Converts float number from google spreadsheet to JS Date objects.
    const subscriptionDateJS = new Date(Date.UTC(0, 0, parsedNumbers.date - 1));

    // Luxon DateTime object.
    const subscriptionDateLuxon = DateTime.fromJSDate(subscriptionDateJS);

    iter(
      parsedNumbers.id,
      subscriptionDateLuxon,
      sheet.getCell(rowIndex, columnIndex.id),
      sheet.getCell(rowIndex, columnIndex.date)
    );

    rowIndex++;

    row = {
      id: sheet.getCell(rowIndex, columnIndex.id).value,
      date: sheet.getCell(rowIndex, columnIndex.date).value,
    };
  }
}
