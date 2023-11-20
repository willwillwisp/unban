import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import sheetsCredentials from "../../sheets-credentials.json";

/**
 * The GoogleDocAuth class provides a method to authenticate and
 * access a Google Spreadsheet using a
 * service account.
 */
export class GoogleDocAuth {
  /**
   * The function returns a Google Spreadsheet document with authentication using a service account.
   * @param {string} sheetURL - The `sheetURL` parameter is a string that represents the URL of the
   * Google Sheets document that you want to access.
   * @returns a new instance of the GoogleSpreadsheet class with the provided sheetURL and
   * serviceAccountAuth.
   */
  public getDocWithAuth(sheetURL: string) {
    const serviceAccountAuth = new JWT({
      email: sheetsCredentials.client_email,
      key: sheetsCredentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return new GoogleSpreadsheet(sheetURL, serviceAccountAuth);
  }
}
