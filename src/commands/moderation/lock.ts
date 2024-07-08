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

export default class Lock {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("lock")
      .setDescription("Locks a channel")
      .addChannelOption(channel =>
        channel
          .setName("channel")
          .setDescription("The channel that you want to lock.")
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
    const member = guild.members.cache.get(interaction.member?.user.id!)!;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return errorEmbed(
        interaction,
        "You can't execute this command",
        "You need the **Manage Channels** permission."
      );

    const channelOption = interaction.options.getChannel("channel")!;
    const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;

    if (!channel.permissionsFor(guild.id)?.has("SendMessages"))
      return errorEmbed(
        interaction,
        "You can't execute this command",
        "The channel is already locked."
      );

    const embed = new EmbedBuilder()
      .setTitle(`Locked a channel`)
      .setDescription(
        [
          `**Moderator**: ${interaction.user.username}`,
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
      channel.permissionOverwrites
        .create(interaction.guild!.id, {
          SendMessages: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          UseApplicationCommands: false,
          UseEmbeddedActivities: false
        })
        .catch(error => console.error(error));

    const logChannel = getSetting(guild.id, "moderation", "channel");
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
