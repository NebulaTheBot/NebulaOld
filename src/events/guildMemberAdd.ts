import { EmbedBuilder, type Client, type GuildMember, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";

export default {
  name: "guildMemberAdd",
  event: class GuildMemberAdd {
    client: Client;
    constructor(client: Client) {
      this.client = client;
    }

    async run(member: GuildMember) {
      const guildID = member.guild.id;
      const id = getSetting(guildID, "welcome", "channel") as string;
      let text = getSetting(guildID, "welcome", "join_text") as string;
      const user = member.user;
      const guild = member.guild;
      const avatarURL = member.displayAvatarURL();
      const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${user.displayName}`, iconURL: avatarURL })
      .setTitle("Welcome!")
      .setFooter({ text: `User ID: ${member.id}` })
      .setThumbnail(avatarURL)
      .setColor(
        member.user.hexAccentColor ?? (await imageColor(undefined, member)) ?? genColor(200)
      );
      
      if (id) {
        const channel = (await member.guild.channels.cache
          .find(channel => channel.id == id)
          ?.fetch()) as TextChannel;
  
        if (text?.includes("(name)")) text = text.replaceAll("(name)", user.displayName);
        if (text?.includes("(count)")) text = text.replaceAll("(count)", `${guild.memberCount}`);
        if (text?.includes("(servername)")) text = text.replaceAll("(servername)", `${guild.name}`);
        
        embed.setDescription(text)

        await channel.send({ embeds: [embed] });
      }

      const dmwelcome = getSetting(guildID, "welcome", "join_dm") as boolean;
      if (!dmwelcome) return;
      // use join_text, the embed should be already cooked
      const dmChannel = await user.createDM().catch(() => null);
      if (!dmChannel) return;
      if (user.bot) return;
      let dmtext = getSetting(guildID, "welcome", "dm_text") as string;
      if (dmtext) {
        if (dmtext?.includes("(name)")) dmtext = dmtext.replaceAll("(name)", user.displayName);
        if (dmtext?.includes("(count)")) dmtext = dmtext.replaceAll("(count)", `${guild.memberCount}`);
        if (dmtext?.includes("(servername)")) dmtext = dmtext.replaceAll("(servername)", `${guild.name}`);
        embed.setDescription(dmtext);
      }
      await dmChannel
        .send({ embeds: [embed] })
        .catch(() => null);
    }
  }
};
