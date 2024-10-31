import type { Message, TextChannel } from "discord.js";
import { randomise } from "../../utils/randomise";

export default async function run(message: Message) {
  if (!message.content.toLowerCase().includes("fire in the hole")) return;
  const gifs = randomise([
    "https://cdn.discordapp.com/attachments/799130520846991370/1080439680199315487/cat-chomp-fireball.gif?ex=65e8485d&is=65d5d35d&hm=cef8b83df8120f1419082f184d835c6af679c9d02d69f97e335eafa82b33489e&",
    "https://tenor.com/view/dancing-gif-25178472",
    "https://tenor.com/view/fire-in-the-hole-gif-11283103876805231056",
    "https://tenor.com/view/fire-in-the-hole-gif-14799466830322850291"
  ]);

  await (message.channel as TextChannel).send(gifs);
}
