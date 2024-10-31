import type { Message, TextChannel } from "discord.js";
import { randomise } from "../../utils/randomise";

export default async function run(message: Message) {
  if (!message.content.toLowerCase().includes("i'm a big fan")) return;
  const gifs = randomise([
    "https://tenor.com/bC37i.gif",
    "https://tenor.com/view/fan-gif-20757784",
    "https://tenor.com/view/below-deck-im-your-biggest-fan-biggest-fan-kate-kate-chastain-gif-15861715"
  ]);

  await (message.channel as TextChannel).send(gifs);
}
