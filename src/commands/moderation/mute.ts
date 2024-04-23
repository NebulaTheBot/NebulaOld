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
import ms from "ms";

export default class Mute {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("mute")
      .setDescription("Mutes a user.")
      .addUserOption(user =>
        user.setName("user").setDescription("The user that you want to mute.").setRequired(true)
      )
      .addStringOption(string =>
        string
          .setName("duration")
          .setDescription("The duration of the mute (e.g 30m, 1d, 2h).")
          .setRequired(true)
      )
      .addStringOption(string =>
        string.setName("reason").setDescription("The reason for the mute.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const duration = interaction.options.getString("duration")!;
    const guild = interaction.guild!;
    const members = guild.members.cache!;
    const member = members.get(interaction.member?.user.id!)!;
    const target = members.get(user.id)!;
    const name = user.displayName;

    if (!member.permissions.has(PermissionsBitField.Flags.MuteMembers))
      return errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Mute Members** permission."
      );

    if (target === member) return errorEmbed(interaction, "You can't mute yourself.");
    if (target.user.id === interaction.client.user.id)
      return errorEmbed(interaction, "You can't mute Sokora.");

    if (!target.manageable)
      return errorEmbed(
        interaction,
        `You can't mute ${name}.`,
        "The member has a higher role position than Sokora."
      );

    if (member.roles.highest.position < target.roles.highest.position)
      return errorEmbed(
        interaction,
        `You can't mute ${name}.`,
        "The member has a higher role position than you."
      );

    if (!ms(duration) || ms(duration) > ms("28d"))
      return errorEmbed(
        interaction,
        `You can't mute ${name}`,
        "The duration is invalid or is above the 28 day limit."
      );

    const time = new Date(
      Date.parse(new Date().toISOString()) + Date.parse(new Date(ms(duration)).toISOString())
    ).toISOString();
    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${name}`, iconURL: user.displayAvatarURL() })
      .setTitle(`Muted ${name}.`)
      .setDescription(
        [
          `**Moderator**: ${interaction.user.displayName}`,
          `**Duration**: ${ms(ms(duration), { long: true })}`,
          `**Reason**: ${interaction.options.getString("reason") ?? "No reason provided"}`
        ].join("\n")
      )
      .setFooter({ text: `User ID: ${user.id}` })
      .setThumbnail(user.displayAvatarURL())
      .setColor(genColor(100));

    const logChannel = getSetting(interaction.guildId!, "moderation.channel");
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

    await target.edit({ communicationDisabledUntil: time });
    await interaction.reply({ embeds: [embed] });

    const dmChannel = (await user.createDM().catch(() => null)) as DMChannel | null;
    if (!dmChannel) return;
    if (user.bot) return;
    await dmChannel.send({
      embeds: [embed.setTitle("You got muted.").setColor(genColor(0))]
    });
  }
}
