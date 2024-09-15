import {
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import ms from "ms";
import { addModeration } from "../../utils/database/moderation";
import { scheduleUnban } from "../../utils/unbanScheduler";

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

    let expiresAt: number | null = null;

    const error = await errorCheck(
      PermissionsBitField.Flags.BanMembers,
      { interaction, user, action: "Ban" },
      { allErrors: true, botError: true, ownerError: true, outsideError: false },
      "Ban Members"
    );
    
    if (error) return; 

    if (duration) {
      const durationMs = ms(duration);
      if (!durationMs) {
        return await errorEmbed(
          interaction,
          `You can't ban ${user.username} temporarily.`,
          "The duration is invalid."
        );
      }

      expiresAt = Date.now() + durationMs;
      scheduleUnban(interaction.client, guild.id, user.id, durationMs);
    }

    try {
      await guild.members.ban(user.id, { reason: reason ?? undefined });
    } catch (err) {
      console.error("Failed to ban user:", err);
      return await errorEmbed(interaction, "Ban failed", "An error occurred while banning the user.");
    }

    try {
      addModeration(
        guild.id,
        user.id,
        "BAN",
        interaction.user.id,
        reason ?? "",
        false,
        expiresAt
      );
    } catch (err) {
      console.error("Failed to log moderation record:", err);
    }

    const dmChannel = await guild.members.cache.get(user.id)?.createDM().catch(() => null);
    if (dmChannel && !user.bot) {
      await modEmbed({ interaction, user, action: "Banned", duration }, reason);
    } else {
      await modEmbed({ interaction, user, action: "Banned", duration }, reason);
    }
  }
}