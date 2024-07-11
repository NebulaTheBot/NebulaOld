import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";
import { errorEmbed } from "../../utils/embeds/errorEmbed";

export default class Ban {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("ban")
      .setDescription("Bans a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to ban.").setRequired(true)
      )
      .addStringOption(string =>
        string.setName("duration").setDescription("The duration of the ban (e.g 30m, 1d, 2h).")
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the ban.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;

    await errorCheck(
      PermissionsBitField.Flags.BanMembers,
      { interaction, user, action: "Ban" },
      true,
      true,
      "Ban Members"
    );

    const reason = interaction.options.getString("reason");
    await interaction.guild?.members.cache
      .get(user.id)
      ?.ban({ reason: reason ?? undefined })
      .catch(error => console.error(error));

    await modEmbed({ interaction, user, action: "Banned" }, reason);
  }
}
