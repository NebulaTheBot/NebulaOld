import { EmbedBuilder, type Client, type GuildMember, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";

export default {
  name: "guildMemberRemove",
  event: class GuildMemberRemove {
    client: Client;
    constructor(client: Client) {
      this.client = client;
    }

    async run(member: GuildMember) {
      const guildID = member.guild.id;
      const id = getSetting(guildID, "welcome", "channel") as string;
      if (!id) return;

      let text = getSetting(guildID, "welcome", "goodbye_text") as string;
      const user = member.user;
      const guild = member.guild;
      const channel = (await member.guild.channels.cache
        .find(channel => channel.id === id)
        ?.fetch()) as TextChannel;

      if (text?.includes("(name)")) text = text.replaceAll("(name)", user.displayName);
      if (text?.includes("(count)")) text = text.replaceAll("(count)", `${guild.memberCount}`);
      if (text?.includes("(servername)")) text = text.replaceAll("(servername)", `${guild.name}`);

      const avatarURL = member.displayAvatarURL();
      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${user.displayName}`, iconURL: avatarURL })
        .setTitle("Goodbye!")
        .setDescription(text ?? `**@${user.displayName}** has left the server 😥`)
        .setFooter({ text: `User ID: ${member.id}` })
        .setThumbnail(avatarURL)
        .setColor(
          member.user.hexAccentColor ?? (await imageColor(undefined, member)) ?? genColor(200)
        );

      await channel.send({ embeds: [embed] });
    }
  }
};
