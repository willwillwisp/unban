import { GoogleSpreadsheet } from "google-spreadsheet";
import * as schedule from "node-schedule";
import { Telegraf } from "telegraf";
import { unbanMembersWithExpiredSubscription } from "./unbanMembersWithExpiredSubscription";

export function scheduleUnbanTask(doc: GoogleSpreadsheet, bot: Telegraf, sheetName: string, chatId: number) {
  // Creating a rule for scheduling a job to run every 5 seconds.
  const every5SecondsRange = new schedule.Range(0, 60, 5);

  const ruleEvery5Seconds = new schedule.RecurrenceRule();

  ruleEvery5Seconds.second = every5SecondsRange;

  schedule.scheduleJob("unban", ruleEvery5Seconds, async () => {
    await unbanMembersWithExpiredSubscription(doc, bot, sheetName, chatId);
  });
}
