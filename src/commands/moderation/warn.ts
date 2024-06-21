import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  TextChannel,
  DMChannel,
  ChannelType,
  type Channel,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { getSetting } from "../../utils/database/settings";
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

    errorCheck(
      PermissionsBitField.Flags.ModerateMembers,
      { interaction, user, action: "Warn" },
      "Moderate"
    );

    const reason = interaction.options.getString("reason");
    addModeration(
      guild.id,
      user.id,
      "WARN",
      guild.members.cache.get(interaction.member?.user.id!)?.id!,
      reason ?? undefined
    );
    modEmbed({ interaction, user, action: "Warned" }, reason);
  }
}
