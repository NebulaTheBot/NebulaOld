/**
 * Reacts to a message with multiple emojis.
 * @param message Message to react to.
 * @param emojis Emojis that will be used to react.
 */

import type { Message } from "discord.js";

export async function multiReact(message: Message, ...emojis: string[]) {
  for (const i of emojis) {
    if (typeof i == "object") {
      await message.react(i);
      continue;
    }
    for (const reaction of i) if (reaction != " ") await message.react(reaction);
  }
}
