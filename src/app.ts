import "dotenv/config";
import * as schedule from "node-schedule";
import { Telegraf } from "telegraf";
import { getDocWithAuth } from "./google-spreadsheet/getDocWithAuth";
import { scheduleUnbanTask } from "./node-schedule/scheduleUnbanTask";

const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_SHEET = process.env.GOOGLE_SHEET;
const CHAT_ID = process.env.CHAT_ID;
const SHEET_NAME = process.env.SHEET_NAME;

if (!BOT_TOKEN || !CHAT_ID || !GOOGLE_SHEET || !SHEET_NAME) {
  throw new Error(`Please, provide BOT_TOKEN, CHAT_ID, GOOGLE_SHEET, INTERVAL_MINUTES, SHEET_NAME as env vars!`);
}

const bot = new Telegraf(BOT_TOKEN);

const doc = getDocWithAuth(GOOGLE_SHEET);

void doc.loadInfo().then(() => {
  void bot.launch();

  scheduleUnbanTask(doc, bot, SHEET_NAME, parseInt(CHAT_ID));

  console.log(`Bot started! v${process.env.npm_package_version}`);
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
