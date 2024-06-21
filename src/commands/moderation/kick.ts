import {
  SlashCommandSubcommandBuilder,
  PermissionsBitField,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export default class Kick {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("kick")
      .setDescription("Kicks a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to kick.").setRequired(true)
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the kick.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    errorCheck(PermissionsBitField.Flags.KickMembers, { interaction, user, action: "Kick" });
    const reason = interaction.options.getString("reason");
    await interaction.guild?.members.cache
      .get(user.id)
      ?.kick(reason ?? undefined)
      .catch(error => console.error(error));

    modEmbed({ interaction, user, action: "Kicked" }, reason);
  }
}
