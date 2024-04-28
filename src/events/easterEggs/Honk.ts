import type { Message } from "discord.js";

export default class Honk {
  async run(message: Message) {
    const honks = ["hnok", "hokn", "hkon", "onk", "hon", "honhk", "hhonk", "honkk"];
    if (!honks.includes(message.content.toLowerCase())) return;
    message.channel.send("https://tenor.com/bW8sm.gif");
  }
}
