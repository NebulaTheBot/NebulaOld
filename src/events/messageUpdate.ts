import { codeBlock, EmbedBuilder, type Message } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";

export default {
  name: "messageUpdate",
  event: class MessageUpdate {
    async run(oldMessage: Message, newMessage: Message) {
      const author = oldMessage.author;
      if (author.bot) return;

      const guild = oldMessage.guild!;
      if (!getSetting(guild.id, "moderation", "log_messages")) return;

      const oldContent = oldMessage.content;
      const newContent = newMessage.content;
      if (oldContent == newContent) return;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${author.displayName}`, iconURL: author.displayAvatarURL() })
        .setTitle("Message has been edited.")
        .addFields(
          {
            name: "🕰️ • Old message",
            value: codeBlock(oldContent)
          },
          {
            name: "🔄️ • New message",
            value: codeBlock(newContent)
          }
        )
        .setFooter({ text: `Message ID: ${oldMessage.id}\nUser ID: ${oldMessage.author.id}` })
        .setThumbnail(author.displayAvatarURL())
        .setColor(genColor(60));

      await logChannel(guild, embed);
    }
  }
};
