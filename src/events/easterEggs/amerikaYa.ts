import type { Message, TextChannel } from "discord.js";
import { randomise } from "../../utils/randomise";

export default async function run(message: Message) {
  if (!message.content.toLowerCase().includes("amerika ya")) return;
  const response = randomise([
    "HALLO :D HALLO :D HALLO :D HALLO :D",
    "https://tenor.com/view/america-ya-gif-15374592095658975433"
  ]);

  await (message.channel as TextChannel).send(response);
}
