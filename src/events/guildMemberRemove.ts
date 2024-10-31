import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";
import { replace } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(member: GuildMember) {
  const guildID = member.guild.id;
  const id = getSetting(guildID, "welcome", "channel") as string;
  if (!id) return;

  const channel = (await member.guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const avatarURL = member.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${member.user.displayName} has left`, iconURL: avatarURL })
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatarURL)
    .setColor(member.user.hexAccentColor ?? (await imageColor(undefined, member)) ?? genColor(200));

  replace(member, getSetting(guildID, "welcome", "leave_text") as string, embed);
  await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
