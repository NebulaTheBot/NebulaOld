import {
  PermissionsBitField,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  DMChannel,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";
import { errorCheck } from "../../utils/embeds/modEmbed";

export default class Unban {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("unban")
      .setDescription("Unbans a user.")
      .addStringOption(string =>
        string
          .setName("id")
          .setDescription("The ID of the user that you want to unban.")
          .setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString("id")!;
    const guild = interaction.guild!;
    const member = guild.members.cache.get(interaction.member?.user.id!)!;
    const target = (await guild.bans.fetch())
      .map(user => user.user)
      .filter(user => user.id === id)[0]!;

    await errorCheck(
      PermissionsBitField.Flags.BanMembers,
      { interaction, user: target, action: "Unban" },
      false,
      "Ban Members"
    );

    if (target == undefined)
      return errorEmbed(interaction, "You can't unban this user.", "The user was never banned.");

    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${target.displayName}`, iconURL: target.displayAvatarURL() })
      .setTitle(`Unbanned ${target.displayName}.`)
      .setDescription(`**Moderator**: ${interaction.user.displayName}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `User ID: ${id}` })
      .setColor(genColor(100));

    await logChannel(guild, embed);
    await guild.members.unban(id);
    await interaction.reply({ embeds: [embed] });

    const dmChannel = (await target.createDM().catch(() => null)) as DMChannel | null;
    if (!dmChannel) return;
    if (target.bot) return;
    await dmChannel.send({ embeds: [embed.setTitle("You got unbanned.")] });
  }
}
