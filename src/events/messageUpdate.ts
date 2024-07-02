import { codeBlock, EmbedBuilder, type Message, type TextChannel, type Channel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";

export default {
  name: "messageUpdate",
  event: class MessageUpdate {
    async run(oldMessage: Message, newMessage: Message) {
      const author = oldMessage.author;
      if (author.bot) return;

      const guild = oldMessage.guild!;
      const logUpdate = getSetting(guild.id, "moderation", "log_messages");
      const logChannel = getSetting(guild.id, "moderation", "channel");
      if (!logUpdate) return;
      if (!logChannel) return;

      const oldContent = oldMessage.content;
      const newContent = newMessage.content;
      if (oldContent === newContent) return;

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

      const channel = await guild.channels.cache
        .get(`${logChannel}`)
        ?.fetch()
        .then((channel: Channel) => {
          return channel as TextChannel;
        })
        .catch(() => null);

      if (!channel) return;
      await channel.send({ embeds: [embed] });
    }
  }
};
