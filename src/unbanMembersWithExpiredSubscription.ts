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
    if (!isNaN(parseFloat(row.date))) {
      subscriptionsList.push({
        id: row.id,
        date: parseFloat(row.date),
      });
    }
    rowIndex++;

    row = {
      id: sheet.getCell(rowIndex, columnIndex.id).value?.toString(),
      date: sheet.getCell(rowIndex, columnIndex.date).value?.toString(),
    };
  }

  const groupedSubscriptionList = groupBy(subscriptionsList, (i) => i.id);
  const subs = Object.values(groupedSubscriptionList);

  const idsToHighlight = [];

  for (const sub of subs) {
    const maxDateSub = sub.reduce((max, game) => (max.date > game.date ? max : game));

    try {
      const member = await bot.telegram.getChatMember(chatId, parseInt(maxDateSub.id));

      if (member.status !== "kicked" && member.status !== "left") {
        const subDateJS = new Date(Date.UTC(0, 0, maxDateSub.date - 1));
        const subDateLuxon = DateTime.fromJSDate(subDateJS);
        const now = DateTime.now().minus({ hours: 3 });

        if (subDateLuxon.plus({ days: 30 }) < now) {
          await bot.telegram.unbanChatMember(chatId, member.user.id);
          console.log(`Unban ${member.user.id}`);

          idsToHighlight.push(member.user.id);
        }
      }
    } catch (err) {
      // Member not found
    }
  }

  await highlightUnbanIdInGoogleSheet(doc, sheetName, idsToHighlight);
};

const highlightUnbanIdInGoogleSheet = async (doc: GoogleSpreadsheet, sheetName: string, idsToHighlight: number[]) => {
  const idsToHighlightString = idsToHighlight.map((id) => id.toString());

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
    if (idsToHighlightString.includes(row.id.value.toString())) {
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
