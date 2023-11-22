/**
 * The function converts an serial date number to a JavaScript Date object.
 * @param {number} serial - The serial parameter represents the date value in serial format.
 * Serial format is the number of days since January 1, 1900 (with January 1, 1900 being serial number 1).
 * @returns a JavaScript Date object.
 */
export function serialDateToJSDate(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;

  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}
