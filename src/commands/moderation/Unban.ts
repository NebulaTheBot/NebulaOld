import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

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
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the unban.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString("id")!;
    const reason = interaction.options.getString("reason")!;
    const guild = interaction.guild!;
    const target = (await guild.bans.fetch())
      .map(ban => ban.user)
      .filter(user => user.id == id)[0]!;

    if (
      await errorCheck(
        PermissionsBitField.Flags.BanMembers,
        { interaction, user: target, action: "Unban" },
        { allErrors: false, botError: true, ownerError: true },
        "Ban Members"
      )
    )
      return;

    if (!target)
      return await errorEmbed(
        interaction,
        "You can't unban this user.",
        "The user was never banned."
      );

    await guild.members.unban(id, reason ?? undefined).catch(error => console.error(error));
    await modEmbed({ interaction, user: target, action: "Unbanned" }, reason);
  }
}
