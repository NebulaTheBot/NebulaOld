import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import ms from "ms";
import { addModeration } from "../../utils/database/moderation";

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
        string.setName("reason").setDescription("The reason for the ban.")
      )
      .addStringOption(string =>
        string.setName("duration").setDescription("The duration of the ban (e.g 2mo, 1y).")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const guild = interaction.guild!;
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason");

    let expiresAt: number | undefined;

    if (duration) {
      const durationMs = ms(duration);
      if (!durationMs)
        return await errorEmbed(
          interaction,
          `You can't ban ${user.displayName} temporarily.`,
          "The duration is invalid."
        );
        expiresAt = Date.now() + durationMs;

      setTimeout(async () => {
        await guild.members
          .unban(user.id, reason ?? undefined)
          .catch(error => console.error(error));

        await modEmbed({ interaction, user, action: "Unbanned" }, reason);
      }, ms(duration));
    }

    if (await errorCheck(
      PermissionsBitField.Flags.BanMembers,
      { interaction, user, action: "Ban" },
      { allErrors: true, botError: true, ownerError: true, outsideError: false },
      "Ban Members"
    ) == null) {
      const dmChannel = await guild.members.cache.get(user.id)?.createDM().catch(() => null);
      if (dmChannel && !user.bot) {
        await modEmbed({ interaction, user, action: "Banned", duration }, reason);
      }

      await interaction.guild?.bans
        .create(user.id, { reason: reason ?? undefined })
        .catch(error => console.error(error));
  
        try {
          addModeration(
            guild.id,
            user.id,
            "BAN",
            guild.members.cache.get(interaction.user.id)?.id!,
            reason ?? undefined,
            false,
            expiresAt ?? null
          );
        } catch (error) {
          console.error(error);
        }
      
      if (!dmChannel || user.bot)
        await modEmbed({ interaction, user, action: "Banned", duration }, reason);
    }
  }
}
