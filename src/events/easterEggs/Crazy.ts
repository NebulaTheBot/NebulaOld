import type { Message } from "discord.js";

export default class Crazy {
  async run(message: Message) {
    const crazy = message.content.toLowerCase().split("crazy");

    if (crazy[1] == null) return;
    if (
      ((crazy[0].endsWith(" ") || crazy[0].endsWith("")) && crazy[1].startsWith(" ")) ||
      message.content.toLowerCase() === "crazy"
    ) {
      await message.channel.send(
        "Crazy? I was crazy once.\nThey locked me in a room.\nA rubber room.\nA rubber room with rats.\nAnd rats make me crazy.\nCrazy? I was crazy once..."
      );
    }
  }
}
