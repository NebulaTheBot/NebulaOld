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
      if (!id) return;

      let text = getSetting(guildID, "welcome", "text") as string;
      const user = member.user;
      const guild = member.guild;
      const channel = (await member.guild.channels.cache
        .find(channel => channel.id == id)
        ?.fetch()) as TextChannel;

      if (text?.includes("(name)")) text = text.replaceAll("(name)", user.displayName);
      if (text?.includes("(count)")) text = text.replaceAll("(count)", `${guild.memberCount}`);
      if (text?.includes("(servername)")) text = text.replaceAll("(servername)", `${guild.name}`);

      const avatarURL = member.displayAvatarURL();
      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${user.displayName}`, iconURL: avatarURL })
        .setTitle("Welcome!")
        .setDescription(
          text ??
            `Welcome to ${guild.name}, **${user.displayName}**! Interestingly, you just helped us reach **${guild.memberCount}** members. Enjoy, and have a nice day!`
        )
        .setFooter({ text: `User ID: ${member.id}` })
        .setThumbnail(avatarURL)
        .setColor(
          member.user.hexAccentColor ?? (await imageColor(undefined, member)) ?? genColor(200)
        );

      await channel.send({ embeds: [embed] });

      const dmwelcome = getSetting(guildID, "welcome", "join_dm") as boolean;
      if (!dmwelcome) return;
      // use join_text, the embed should be already cooked
      console.log("zioeuhzioeufgzhoifeunho")
      const dmChannel = await user.createDM().catch(() => null);
      if (!dmChannel) return;
      if (user.bot) return;
      await dmChannel
        .send({ embeds: [embed] })
        .catch(() => null);
    }
  }
};
