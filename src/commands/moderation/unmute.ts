import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

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
    const user = interaction.options.getUser("user")!;
    const target = interaction.guild?.members.cache.get(user.id)!;

    errorCheck(
      PermissionsBitField.Flags.ModerateMembers,
      { interaction, user, action: "Unmute" },
      { allErrors: false, botError: true, ownerError: false },
      "Moderate Members"
    );

    if (target.communicationDisabledUntil === null)
      return await errorEmbed(
        interaction,
        "You can't unmute this user.",
        "The user was never muted."
      );

    await target.edit({ communicationDisabledUntil: null }).catch(error => console.error(error));
    await modEmbed({ interaction, user, action: "Unmuted" }, undefined, true);
  }
}
