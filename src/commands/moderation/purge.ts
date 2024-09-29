import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";

export default class Clear {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("clear")
      .setDescription("Clears messages.")
      .addNumberOption(number =>
        number
          .setName("amount")
          .setDescription("The amount of messages that you want to clear (maximum is 100).")
          .setRequired(true)
      )
      .addChannelOption(channel =>
        channel
          .setName("channel")
          .setDescription("The channel that has the messages that you want to clear.")
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.GuildVoice
          )
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    if (
      !guild.members.cache
        .get(interaction.user.id)
        ?.permissions.has(PermissionsBitField.Flags.ManageMessages)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Messages** permission."
      );

    const amount = interaction.options.getNumber("amount")!;
    if (amount > 100)
      return await errorEmbed(interaction, "You can only clear up to 100 messages at a time.");

    if (amount < 1) return await errorEmbed(interaction, "You must clear at least 1 message.");

    const channelOption = interaction.options.getChannel("channel")!;
    const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
    const embed = new EmbedBuilder()
      .setTitle(`Cleared ${amount} message${amount == 1 ? "" : "s"}.`)
      .setDescription(
        [
          `Moderator responsible is **${interaction.user.displayName}**`,
          `Cleared messages of the **${channelOption ?? `<#${channel.id}>** channel`}`
        ].join("\n")
      )
      .setColor(genColor(100));

    if (
      channel.type == ChannelType.GuildText &&
      ChannelType.PublicThread &&
      ChannelType.PrivateThread &&
      ChannelType.GuildVoice
    )
      try {
        channel == interaction.channel
          ? await channel.bulkDelete(amount + 1, true)
          : await channel.bulkDelete(amount, true);
      } catch (error) {
        console.error(error);
      }

    await logChannel(guild, embed);
    await interaction.reply({ embeds: [embed] });
  }
}
