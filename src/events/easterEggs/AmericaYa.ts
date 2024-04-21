import type { Message } from "discord.js";
import { randomise } from "../../utils/randomise";

export default class AmericaYa {
  async run(message: Message) {
    if (message.content.toLowerCase().includes("america ya")) {
      const response = randomise([
        "HALLO :D HALLO :D HALLO :D HALLO :D",
        "https://tenor.com/view/america-ya-gif-15374592095658975433"
      ]);

      await message.channel.send(response);
    }
  }
}
