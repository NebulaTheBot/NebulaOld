import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { addModeration } from "../../utils/database/moderation";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export default class Warn {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("warn")
      .setDescription("Warns a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to warn.").setRequired(true)
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the warn.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const guild = interaction.guild!;
    const reason = interaction.options.getString("reason");

    await errorCheck(
      PermissionsBitField.Flags.ModerateMembers,
      { interaction, user, action: "Warn" },
      { allErrors: true, botError: false, ownerError: true },
      "Moderate Members"
    );

    try {
      addModeration(
        guild.id,
        user.id,
        "WARN",
        guild.members.cache.get(interaction.user.id)?.id!,
        reason ?? undefined
      );
    } catch (error) {
      console.error(error);
    }

    await modEmbed({ interaction, user, action: "Warned" }, reason);
  }
}
