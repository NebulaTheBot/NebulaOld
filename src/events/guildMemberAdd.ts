import { EmbedBuilder, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";
import { replace } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(member) {
  const guildID = member.guild.id;
  const id = getSetting(guildID, "welcome", "channel") as string;
  const user = member.user;
  const avatarURL = member.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${user.displayName} has joined`, iconURL: avatarURL })
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatarURL)
    .setColor(member.user.hexAccentColor ?? (await imageColor(undefined, member)) ?? genColor(200));

  if (id) {
    const channel = (await member.guild.channels.cache
      .find(channel => channel.id == id)
      ?.fetch()) as TextChannel;

    replace(member, getSetting(guildID, "welcome", "join_text") as string, embed);
    await channel.send({ embeds: [embed] });
  }

  if (!getSetting(guildID, "welcome", "join_dm") as boolean) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel) return;
  if (user.bot) return;

  replace(member, getSetting(guildID, "welcome", "dm_text") as string, embed);
  await dmChannel.send({ embeds: [embed] }).catch(() => null);
} as Event<"guildMemberAdd">);
