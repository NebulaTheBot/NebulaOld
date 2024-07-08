import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  DMChannel,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";

export default class Unmute {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("unmute")
      .setDescription("Unmutes a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to unmute.").setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const members = guild.members.cache!;
    if (
      !members
        .get(interaction.member!.user.id)!
        .permissions.has(PermissionsBitField.Flags.ModerateMembers)
    )
      return errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Mute Members** permission."
      );

    const user = interaction.options.getUser("user")!;
    if (members.get(user.id)?.communicationDisabledUntil === null)
      return errorEmbed(interaction, "You can't unmute this user.", "The user was never muted.");

    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${user.displayName}`, iconURL: user.displayAvatarURL() })
      .setTitle(`Unmuted ${user.displayName}.`)
      .setDescription(
        [
          `**Moderator**: ${interaction.user.displayName}`,
          `**Date**: <t:${Math.floor(Date.now() / 1000)}:f>`
        ].join("\n")
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setColor(genColor(100));

    await logChannel(guild, embed);
    await members.get(user.id)!.edit({ communicationDisabledUntil: null });
    await interaction.reply({ embeds: [embed] });

    const dmChannel = (await user.createDM().catch(() => null)) as DMChannel | null;
    if (!dmChannel) return;
    if (user.bot) return;
    await dmChannel.send({ embeds: [embed.setTitle("You got unmuted.")] });
  }
}
