import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { listUserModeration } from "../../utils/database/moderation";
import { errorEmbed } from "../../utils/embeds/errorEmbed";

export default class Warns {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("warns")
      .setDescription("Warns of a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to see.").setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    if (
      !guild.members.cache
        .get(interaction.user.id)
        ?.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Moderate Members** permission."
      );

    const user = interaction.options.getUser("user")!;
    const warns = listUserModeration(guild.id, user.id, "WARN");
    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${user.displayName}`, iconURL: user.displayAvatarURL() })
      .setTitle(`Warns of ${user.displayName}.`)
      .setFields(
        warns.length > 0
          ? warns.map(warn => {
              return {
                name: `#${warn.id}`,
                value: [
                  `**Moderator**: <@${warn.moderator}>`,
                  `**Reason**: ${warn.reason}`,
                  `**Date**: <t:${Math.floor(warn.timestamp.getTime() / 1000)}:f>`
                ].join("\n")
              };
            })
          : [{ name: "No warns", value: "This user has no warns." }]
      )
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setColor(genColor(100));

    await interaction.reply({ embeds: [embed] });
  }
}
