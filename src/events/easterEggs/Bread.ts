import type { Message } from "discord.js";
import { multiReact } from "../../utils/multiReact";

export default class Bread {
  async run(message: Message) {
    const breadSplit = message.content.toLowerCase().split("bread");

    if (!breadSplit[1]) return;
    if (
      ((breadSplit[0].endsWith(" ") || breadSplit[0].endsWith("")) &&
        breadSplit[1].startsWith(" ")) ||
      message.content.toLowerCase() == "bread"
    ) {
      if (Math.round(Math.random() * 100) <= 0.25)
        message.channel.send("https://tenor.com/bOMAb.gif");
      else await multiReact(message, "🍞🇧🇷🇪🇦🇩👍");
    }
  }
}
