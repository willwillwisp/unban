import { GoogleSpreadsheet } from "google-spreadsheet";
import { DateTime } from "luxon";
import { Telegraf } from "telegraf";
import { groupBy } from "./utils";

export const unbanMembersWithExpiredSubscription = async (doc: GoogleSpreadsheet, bot: Telegraf, sheetName: string, chatId: number) => {
  const sheet = doc.sheetsByTitle[sheetName];

  await sheet.loadCells({
    startRowIndex: 0,
    startColumnIndex: 0,
    endColumnIndex: 2,
  });

  const columnIndex = {
    id: 0,
    date: 1,
  };

  const subscriptionsList = [];

  let rowIndex = 0;

  let row = {
    id: sheet.getCell(rowIndex, columnIndex.id).value?.toString(),
    date: sheet.getCell(rowIndex, columnIndex.date).value?.toString(),
  };

  while (row.id && row.date) {
    subscriptionsList.push({
      id: row.id,
      date: row.date,
    });

    rowIndex++;

    row = {
      id: sheet.getCell(rowIndex, columnIndex.id).value?.toString(),
      date: sheet.getCell(rowIndex, columnIndex.date).value?.toString(),
    };
  }

  const groupedSubscriptionList = groupBy(subscriptionsList, (i) => i.id);
  const subs = Object.values(groupedSubscriptionList);

  for (const sub of subs) {
    const maxDateSub = sub.reduce((max, game) => (max.date > game.date ? max : game));

    try {
      const member = await bot.telegram.getChatMember(chatId, parseInt(maxDateSub.id));

      if (member.status !== "kicked" && member.status !== "left") {
        const subDateJS = new Date(Date.UTC(0, 0, parseFloat(maxDateSub.date) - 1));
        const subDateLuxon = DateTime.fromJSDate(subDateJS);
        const now = DateTime.now().minus({ hours: 3 });

        if (subDateLuxon.plus({ month: 1 }) < now) {
          await bot.telegram.unbanChatMember(chatId, member.user.id);
          console.log(`Unban ${member.user.id}`);

          await highlightUnbanIdInGoogleSheet(doc, sheetName, member.user.id);
        }
      }
    } catch (err) {
      // Member not found
    }
  }
};

const highlightUnbanIdInGoogleSheet = async (doc: GoogleSpreadsheet, sheetName: string, id: number) => {
  const sheet = doc.sheetsByTitle[sheetName];

  await sheet.loadCells({
    startRowIndex: 0,
    startColumnIndex: 0,
    endColumnIndex: 2,
  });

  const columnIndex = {
    id: 0,
    date: 1,
  };

  let rowIndex = 0;

  let row = {
    id: sheet.getCell(rowIndex, columnIndex.id),
    date: sheet.getCell(rowIndex, columnIndex.date),
  };

  while (typeof row.id.value === "number" || typeof row.id.value === "string") {
    if (row.id.value.toString() === id.toString()) {
      const highlightStyle = {
        rgbColor: {
          red: 1,
          green: 0,
          blue: 0,
        },
      };

      row.id.backgroundColorStyle = highlightStyle;
      row.date.backgroundColorStyle = highlightStyle;
    }

    rowIndex++;

    row = {
      id: sheet.getCell(rowIndex, columnIndex.id),
      date: sheet.getCell(rowIndex, columnIndex.date),
    };
  }

  await sheet.saveUpdatedCells(); // save all updates in one call
};
