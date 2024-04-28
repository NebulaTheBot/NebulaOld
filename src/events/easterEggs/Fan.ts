import type { Message } from "discord.js";
import { randomise } from "../../utils/randomise";

export default class Fan {
  async run(message: Message) {
    if (!message.content.toLowerCase().includes("i'm a big fan")) return;
    const gifs = randomise([
      "https://tenor.com/bC37i.gif",
      "https://tenor.com/view/fan-gif-20757784",
      "https://tenor.com/view/below-deck-im-your-biggest-fan-biggest-fan-kate-kate-chastain-gif-15861715"
    ]);

    await message.channel.send(gifs);
  }
}
