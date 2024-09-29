import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import ms from "ms";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export default class Mute {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("mute")
      .setDescription("Mutes a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to mute.").setRequired(true)
      )
      .addStringOption(string =>
        string
          .setName("duration")
          .setDescription("The duration of the mute (e.g 30m, 1d, 2h).")
          .setRequired(true)
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the mute.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const duration = interaction.options.getString("duration")!;
    const reason = interaction.options.getString("reason");
    if (
      await errorCheck(
        PermissionsBitField.Flags.ModerateMembers,
        { interaction, user, action: "Mute" },
        { allErrors: true, botError: true, ownerError: true },
        "Moderate Members"
      )
    )
      return;

    if (!ms(duration) || ms(duration) > ms("28d"))
      return await errorEmbed(
        interaction,
        `You can't mute ${user.displayName}.`,
        "The duration is invalid or is above the 28 day limit."
      );

    const time = new Date(
      Date.parse(new Date().toISOString()) + Date.parse(new Date(ms(duration)).toISOString())
    ).toISOString();

    await interaction.guild?.members.cache
      .get(user.id)
      ?.edit({ communicationDisabledUntil: time, reason: reason ?? undefined })
      .catch(error => console.error(error));

    await modEmbed(
      { interaction, user, action: "Muted", duration, dm: true, dbAction: "MUTE" },
      reason,
      true
    );
  }
}
