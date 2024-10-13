import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import ms from "ms";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";

export default class Slowdown {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("slowdown")
      .setDescription("Slows a channel down.")
      .addStringOption(string =>
        string
          .setName("time")
          .setDescription(
            "Time to slow the channel down to (e.g 30m, 1d, 2h). 0 to remove slowdown."
          )
          .setRequired(true)
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the slowdown.")
      )
      .addChannelOption(channel =>
        channel
          .setName("channel")
          .setDescription("The channel that you want to slowdown.")
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
        ?.permissions.has(PermissionsBitField.Flags.ManageChannels)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Channels** permission."
      );

    const time = interaction.options.getString("time")!;
    const reason = interaction.options.getString("reason");
    const channelOption = interaction.options.getChannel("channel")!;
    const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
    let title = `Set a slowdown of \`${channelOption ?? `${channel.name}`}\` to ${ms(ms(time), {
      long: true
    })}.`;
    if (!ms(time)) title = `Removed the slowdown from \`${channelOption ?? `${channel.name}`}\`.`;

    const embed = new EmbedBuilder()
      .setAuthor({ name: title })
      .setDescription(
        [
          `**Moderator**: ${interaction.user.displayName}`,
          reason ? `**Reason**: ${reason}` : "*No reason provided*",
          `**Channel**: ${channelOption ?? `<#${channel.id}>**`}`
        ].join("\n")
      )
      .setColor(genColor(100));

    if (
      channel.type == ChannelType.GuildText &&
      ChannelType.PublicThread &&
      ChannelType.PrivateThread &&
      ChannelType.GuildVoice
    )
      await channel
        .setRateLimitPerUser(ms(time) / 1000, interaction.options.getString("reason")!)
        .catch(error => console.error(error));

    await logChannel(guild, embed);
    await interaction.reply({ embeds: [embed] });
  }
}
