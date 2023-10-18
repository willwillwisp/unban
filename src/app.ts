import "dotenv/config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Telegraf } from "telegraf";
import sheetsCredentials from "../sheets-credentials.json";
import { unbanMembersWithExpiredSubscription } from "./unbanMembersWithExpiredSubscription";
import * as schedule from "node-schedule";

const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_SHEET = process.env.GOOGLE_SHEET;

const CHAT_ID = process.env.CHAT_ID;

const SHEET_NAME = process.env.SHEET_NAME;

if (!BOT_TOKEN || !CHAT_ID || !GOOGLE_SHEET || !SHEET_NAME) {
  throw new Error(`Please, provide BOT_TOKEN, CHAT_ID, GOOGLE_SHEET, INTERVAL_MINUTES, SHEET_NAME as env vars!`);
}

const bot = new Telegraf(BOT_TOKEN);

const serviceAccountAuth = new JWT({
  email: sheetsCredentials.client_email,
  key: sheetsCredentials.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(GOOGLE_SHEET, serviceAccountAuth);

const ruleEvery5Seconds = new schedule.RecurrenceRule();
const ruleEveryDay = new schedule.RecurrenceRule();

const every5Seconds = new schedule.Range(0, 60, 5);
ruleEvery5Seconds.second = every5Seconds;

const everyDay = new schedule.Range(0, 6);
ruleEveryDay.dayOfWeek = everyDay;

void doc.loadInfo().then(() => {
  void bot.launch();

  schedule.scheduleJob("unban", ruleEvery5Seconds, () => {
    void unbanMembersWithExpiredSubscription(doc, bot, SHEET_NAME, parseInt(CHAT_ID));
  });

  console.log("Bot started!");
  console.log(schedule.scheduledJobs.unban ? "Unban job scheduled!" : "Error while scheduling unban!");
});

// Enable graceful stop
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  void schedule.gracefulShutdown();
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  void schedule.gracefulShutdown();
});
