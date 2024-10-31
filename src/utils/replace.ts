import type { GuildMember, EmbedBuilder } from "discord.js";

export function replace(member: GuildMember, text: string, embed: EmbedBuilder) {
  const user = member.user;
  const guild = member.guild;
  if (text?.includes("(name)")) text = text.replaceAll("(name)", user.displayName);
  if (text?.includes("(count)")) text = text.replaceAll("(count)", `${guild.memberCount}`);
  if (text?.includes("(servername)")) text = text.replaceAll("(servername)", `${guild.name}`);
  embed.setDescription(text);
}
