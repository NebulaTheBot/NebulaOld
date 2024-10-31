import { codeBlock, EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import { Event } from "../utils/types";

export default (async function run(oldMessage, newMessage) {
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!getSetting(guild.id, "moderation", "log_messages")) return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName}'s message has been edited`,
      iconURL: author.displayAvatarURL()
    })
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
    .setFooter({ text: `Message ID: ${oldMessage.id}\nUser ID: ${author.id}` })
    .setColor(genColor(60));

  await logChannel(guild, embed);
} as Event<"messageUpdate">);
