import type { Message, TextChannel } from "discord.js";
import { multiReact } from "../../utils/multiReact";

export default async function run(message: Message) {
  if (!message.content.toLowerCase().includes("bread")) return;

  if (Math.round(Math.random() * 100) <= 0.25)
    (message.channel as TextChannel).send("https://tenor.com/bOMAb.gif");
  else await multiReact(message, "🍞🇧🇷🇪🇦🇩👍");
}
