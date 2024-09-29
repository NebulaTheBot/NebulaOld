import { codeBlock, EmbedBuilder, type Message } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";

export default {
  name: "messageDelete",
  event: class MessageDelete {
    async run(message: Message) {
      const author = message.author;
      if (author.bot) return;

      const guild = message.guild!;
      if (!getSetting(guild.id, "moderation", "log_messages")) return;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${author.displayName}`, iconURL: author.displayAvatarURL() })
        .setTitle("Message has been deleted.")
        .addFields({
          name: "🗞️ • Deleted message",
          value: codeBlock(message.content)
        })
        .setFooter({ text: `Message ID: ${message.id}\nUser ID: ${message.author.id}` })
        .setColor(genColor(60));

      await logChannel(guild, embed);
    }
  }
};
