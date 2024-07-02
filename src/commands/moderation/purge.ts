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

export default class Purge {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("purge")
      .setDescription("Purges messages.")
      .addNumberOption(number =>
        number
          .setName("amount")
          .setDescription("The amount of messages that you want to purge.")
          .setRequired(true)
      )
      .addChannelOption(channel =>
        channel
          .setName("channel")
          .setDescription("The channel that you want to purge.")
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
    const amount = interaction.options.getNumber("amount")!;
    const member = guild.members.cache.get(interaction.member?.user.id!)!;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return errorEmbed(
        interaction,
        "You can't execute this command",
        "You need the **Manage Messages** permission."
      );

    if (amount > 100)
      return errorEmbed(interaction, "You can only purge up to 100 messages at a time.");

    if (amount < 1) return errorEmbed(interaction, "You must purge at least 1 message.");

    const channelOption = interaction.options.getChannel("channel")!;
    const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
    const embed = new EmbedBuilder()
      .setTitle(`Purged ${amount} message${amount == 1 ? "" : "s"}.`)
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
      channel == interaction.channel
        ? await channel.bulkDelete(amount + 1, true)
        : await channel.bulkDelete(amount, true);

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
