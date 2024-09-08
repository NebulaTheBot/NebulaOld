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
      )
      .addBooleanOption(bool =>
        bool.setName("show_moderator").setDescription("Inform the warned user of the moderator that took the action. Defaults to false")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const guild = interaction.guild!;
    const reason = interaction.options.getString("reason");
    const showModerator = interaction.options.getBoolean("show_moderator") ?? false;

    if (await errorCheck(
      PermissionsBitField.Flags.ModerateMembers,
      { interaction, user, action: "Warn" },
      { allErrors: true, botError: false, ownerError: true },
      "Moderate Members"
    ) == null) {
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
  
      await modEmbed({ interaction, user, action: "Warned" }, reason, false, showModerator);
    }
  }
}
