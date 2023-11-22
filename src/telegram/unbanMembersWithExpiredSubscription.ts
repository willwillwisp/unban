import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { DateTime, Duration } from "luxon";
import { Telegraf } from "telegraf";
import { getSubscribersInChat } from "./getSubscribersInChat";
import { iterateGoogleSpreadsheet } from "../google-spreadsheet/iterateGoogleSpreadsheet";
import { SheetDurationStatus, Subscription } from "../types/Subscription";
import { groupBy } from "../utils/groupBy";

/**
 * The function `unbanMembersWithExpiredSubscription` takes a Google Spreadsheet, a Telegram bot, a
 * sheet name, and a chat ID as input, and it iterates over the spreadsheet to find members with
 * expired subscriptions in the specified chat, unbans them, and highlights their IDs in the
 * spreadsheet.
 * @param {GoogleSpreadsheet} doc - The `doc` parameter is a Google Spreadsheet document object. It
 * represents the Google Spreadsheet that contains the subscription data.
 * @param {Telegraf} bot - The `bot` parameter is an instance of the Telegraf library, which is used
 * for interacting with the Telegram Bot API. It is used to unban chat members by calling the
 * `unbanChatMember` method.
 * @param {string} sheetName - The `sheetName` parameter is a string that represents the name of the
 * sheet in the Google Spreadsheet where the subscription data is stored.
 * @param {number} chatId - The `chatId` parameter is the ID of the Telegram chat where the members are
 * banned.
 */
export async function unbanMembersWithExpiredSubscription(
  doc: GoogleSpreadsheet,
  bot: Telegraf,
  sheetName: string,
  chatId: number
) {
  const sheet = doc.sheetsByTitle[sheetName];

  // Load to memory all rows and only first 4 columns.
  // Note: Size of all table cells (without limits) ~1.5GB RAM :)
  await sheet.loadCells({
    startRowIndex: 0,
    startColumnIndex: 0,
    endColumnIndex: 3,
  });

  const subscriptionsList: Subscription[] = [];

  iterateGoogleSpreadsheet(sheet, (subscription) => {
    subscriptionsList.push(subscription);
  });

  /**
   * Grouping the `subscriptionsList` array by the `id` property of each object in the array.
   */
  const groupedSubscriptionList = groupBy(subscriptionsList, (i) => i.id);
  const subscribers = Object.values(groupedSubscriptionList);

  /**
   * `idsToHighlight` is an array that stores the IDs of chat members who need to be highlighted
   * in the Google Sheet. These members have expired subscriptions and should be unbanned. The
   * array is populated during the iteration over the `subscribers` array, and the IDs are added
   * to `idsToHighlight` if the member's subscription date is more than 30 days in the past.
   * Later, the `highlightUnbanIdInGoogleSheet` function uses this array to apply a highlight
   * style to the corresponding rows in the Google Sheet.
   */
  const idsToHighlight: number[] = [];

  const subscribersInChat = await getSubscribersInChat(bot, chatId, subscribers);

  for (const subscriber of subscribersInChat) {
    const datesForSubscriber = subscribers.find((sub) => sub[0].id === subscriber.user.id);

    if (!datesForSubscriber) continue;

    // Find sub with last subscription date.
    const lastSubscription = datesForSubscriber.reduce((max, curr) => (max.date > curr.date ? max : curr));

    // Statuses listed in telegram bot api.
    const skipStatuses = ["kicked", "left", "creator", "administrator"];

    // Skip iteration if member was in chat but kicked/left or creator/administrator.
    if (skipStatuses.includes(subscriber.status)) continue;

    // Luxon DateTime object.
    const subscriptionDateLuxon = lastSubscription.date;

    const now = DateTime.now().setZone("UTC+3");

    // Subscription expires within 30 days by default.
    let durationToAdd = Duration.fromObject({ days: 30 });

    // If last sub duration is valid Duration (Luxon) object.
    if (lastSubscription.duration instanceof Duration && lastSubscription.duration.isValid) {
      // Set durationToAdd to valid Duration (Luxon) object from lastSub.
      durationToAdd = lastSubscription.duration;
    }

    const expireDate = subscriptionDateLuxon.plus(durationToAdd);
    const isSubscriptionInfinite = lastSubscription.duration === SheetDurationStatus.INFINITE;
    const isSubscriptionExpired = expireDate < now;

    // If last sub duration status is not INFINITE and subscription expired.
    if (!isSubscriptionInfinite && isSubscriptionExpired) {
      await bot.telegram.unbanChatMember(chatId, subscriber.user.id);

      console.log(`--Unban ${subscriber.user.id}--`);
      console.log("Подписка: ", lastSubscription.date.toString());
      console.log("Истечение: ", expireDate.toString());
      console.log("Сейчас: ", now.toString());
      console.log("Длительность", expireDate.diff(lastSubscription.date, "days").toHuman());

      idsToHighlight.push(subscriber.user.id);
    }
  }

  highlightRowsInGoogleSheet(sheet, idsToHighlight);

  // Save all updates in one call.
  await sheet.saveUpdatedCells();
}

/**
 * The function `highlightRowsInGoogleSheet` takes a Google Spreadsheet worksheet and an array of IDs
 * to highlight, and sets the background color of specific rows in the spreadsheet to red.
 * @param {GoogleSpreadsheetWorksheet} sheet - The `sheet` parameter is the Google Spreadsheet
 * worksheet object on which you want to highlight rows.
 * @param {number[]} idsToHighlight - An array of numbers representing the IDs of the rows that need to
 * be highlighted in the Google Spreadsheet.
 */
const highlightRowsInGoogleSheet = (sheet: GoogleSpreadsheetWorksheet, idsToHighlight: number[]) => {
  if (idsToHighlight.length === 0) return;

  iterateGoogleSpreadsheet(sheet, (subscription, cellData) => {
    if (idsToHighlight.includes(subscription.id)) {
      const highlightStyle = {
        rgbColor: {
          red: 1,
          green: 0,
          blue: 0,
        },
      };

      // Setting the background color of the cells in the Google Spreadsheet.
      cellData.id.backgroundColorStyle = highlightStyle;
      cellData.date.backgroundColorStyle = highlightStyle;
      cellData.duration.backgroundColorStyle = highlightStyle;
    }
  });
};
