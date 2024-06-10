import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  TextChannel,
  type Channel,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { getSetting } from "../../utils/database/settings";
import ms from "ms";

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
    const time = interaction.options.getString("time")!;
    const member = guild.members.cache.get(interaction.member?.user.id!)!;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return errorEmbed(
        interaction,
        "You can't execute this command",
        "You need the **Manage Channels** permission."
      );

    const channelOption = interaction.options.getChannel("channel")!;
    const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;

    let title = `Set a slowdown of \`${channelOption ?? `${channel.name}`}\` to ${ms(ms(time), {
      long: true
    })}.`;
    if (ms(time) === 0)
      title = `Removed the slowdown from \`${channelOption ?? `${channel.name}`}\`.`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        [
          `**Moderator**: ${interaction.user.username}`,
          `**Reason**: ${interaction.options.getString("reason") ?? "No reason provided"}`,
          `**Channel**: ${channelOption ?? `<#${channel.id}>`}`
        ].join("\n")
      )
      .setColor(genColor(100));

    if (
      channel.type === ChannelType.GuildText &&
      ChannelType.PublicThread &&
      ChannelType.PrivateThread &&
      ChannelType.GuildVoice
    )
      await channel.setRateLimitPerUser(ms(time) / 1000, interaction.options.getString("reason")!);

    const logChannel = getSetting(guild.id, "moderation.channel");
    if (logChannel) {
      const channel = await guild.channels.cache
        .get(`${logChannel}`)
        ?.fetch()
        .then((channel: Channel) => {
          if (channel.type != ChannelType.GuildText) return null;
          return channel as TextChannel;
        })
        .catch(() => null);

      if (channel) await channel.send({ embeds: [embed] });
    }

    await interaction.reply({ embeds: [embed] });
  }
}
