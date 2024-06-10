import {
  SlashCommandSubcommandBuilder,
  PermissionsBitField,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { modEmbed } from "../../utils/embeds/modEmbed";

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
    const guild = interaction.guild!;
    const members = guild.members.cache;
    const member = members.get(interaction.member?.user.id!)!;
    const target = members.get(user.id)!;
    const name = user.displayName;

    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Ban Members** permission."
      );

    if (target === member) return errorEmbed(interaction, "You can't ban yourself.");
    if (target.user.id === interaction.client.user.id)
      return errorEmbed(interaction, "You can't ban Sokora.");

    if (!target.manageable)
      return errorEmbed(
        interaction,
        `You can't ban ${name}.`,
        "The member has a higher role position than Sokora."
      );

    if (member.roles.highest.position < target.roles.highest.position)
      return errorEmbed(
        interaction,
        `You can't ban ${name}.`,
        "The member has a higher role position than you."
      );

    const reason = interaction.options.getString("reason");
    await target.ban({ reason: reason ?? undefined });
    await modEmbed({ interaction, user, action: "Banned", reason });
  }
}
