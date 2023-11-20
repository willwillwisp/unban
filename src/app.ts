import "dotenv/config";
import { Telegraf } from "telegraf";
import { unbanMembersWithExpiredSubscription } from "./unbanMembersWithExpiredSubscription";
import * as schedule from "node-schedule";
import { GoogleDocAuth } from "./auth/GoogleSheetsAuth";

const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_SHEET = process.env.GOOGLE_SHEET;
const CHAT_ID = process.env.CHAT_ID;
const SHEET_NAME = process.env.SHEET_NAME;

if (!BOT_TOKEN || !CHAT_ID || !GOOGLE_SHEET || !SHEET_NAME) {
  throw new Error(`Please, provide BOT_TOKEN, CHAT_ID, GOOGLE_SHEET, INTERVAL_MINUTES, SHEET_NAME as env vars!`);
}

const bot = new Telegraf(BOT_TOKEN);

const doc = new GoogleDocAuth().getDocWithAuth(GOOGLE_SHEET);

/* Creating a rule for scheduling a job to run every 5 seconds. */
const ruleEvery5Seconds = new schedule.RecurrenceRule();
const every5Seconds = new schedule.Range(0, 60, 5);
ruleEvery5Seconds.second = every5Seconds;

void doc.loadInfo().then(() => {
  void bot.launch();

  schedule.scheduleJob("unban", ruleEvery5Seconds, async () => {
    await unbanMembersWithExpiredSubscription(doc, bot, SHEET_NAME, parseInt(CHAT_ID));
  });

  console.log("Bot started! v1.3");
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
