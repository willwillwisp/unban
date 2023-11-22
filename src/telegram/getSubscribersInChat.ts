import { Telegraf } from "telegraf";
import { ChatMember } from "typegram";
import { Subscribers } from "../types/Subscription";

/**
 * The function `getSubscribersInChat` takes a Telegram bot, chat ID, and a list of subscribers, and
 * returns a list of chat members who are also subscribers.
 * @param {Telegraf} bot - The `bot` parameter is an instance of the Telegraf class, which is a
 * framework for building Telegram bots in Node.js.
 * @param {number} chatId - The `chatId` parameter is the unique identifier of the chat or group where
 * you want to get the subscribers. It is usually a number that represents the chat or group ID.
 * @param {Subscribers} subscribers - The `subscribers` parameter is a collection of subscribers. It is
 * of type `Subscribers`, which is likely an array or a map-like object containing information about
 * the subscribers. Each subscriber object in the collection may have properties such as `id`, `name`,
 * or any other relevant information about the
 * @returns an array of ChatMember objects.
 */
export async function getSubscribersInChat(bot: Telegraf, chatId: number, subscribers: Subscribers) {
  const promises: Promise<ChatMember>[] = [];

  subscribers.forEach((sub) => {
    promises.push(bot.telegram.getChatMember(chatId, sub[0].id));
  });

  const sheetIdsPromises = await Promise.allSettled(promises);

  const chatMemberPromises = sheetIdsPromises.filter((member) => member.status === "fulfilled");

  const subscribersInChat = chatMemberPromises.map((a) => {
    if (a.status === "fulfilled") {
      return a.value;
    }
  });

  return subscribersInChat.filter((a) => a) as ChatMember[];
}
