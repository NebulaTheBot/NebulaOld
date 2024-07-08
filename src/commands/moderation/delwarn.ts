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
import { listUserModeration, removeModeration } from "../../utils/database/moderation";
import { getSetting } from "../../utils/database/settings";

export default class Delwarn {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("delwarn")
      .setDescription("Removes a warning from a user.")
      .addUserOption(user =>
        user
          .setName("user")
          .setDescription("The user that you want to free from the warning.")
          .setRequired(true)
      )
      .addNumberOption(number =>
        number.setName("id").setDescription("The id of the warn.").setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const guild = interaction.guild!;
    const members = guild.members.cache;
    const member = members.get(interaction.member?.user.id!)!;
    const target = members.get(user.id)!;
    const name = user.displayName;
    const id = interaction.options.getNumber("id", true);
    const warns = listUserModeration(guild.id, user.id, "WARN");
    const newWarns = warns.filter(warn => warn.id !== `${id}`);

    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Moderate Members** permission."
      );

    if (target === member) return errorEmbed(interaction, "You can't remove a warn from yourself.");
    if (newWarns.length === warns.length)
      return errorEmbed(interaction, `There is no warn with the id of ${id}.`);

    if (!target.manageable)
      return errorEmbed(
        interaction,
        `You can't remove a warn from ${name}.`,
        "The member has a higher role position than Sokora."
      );

    if (member.roles.highest.position < target.roles.highest.position)
      return errorEmbed(
        interaction,
        `You can't remove a warn from ${name}.`,
        "The member has a higher role position than you."
      );

    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${name}`, iconURL: user.displayAvatarURL() })
      .setTitle(`Removed a warning from ${name}.`)
      .setDescription(`**Moderator**: ${interaction.user.displayName}`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setColor(genColor(100));

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

    try {
      removeModeration(guild.id, `${id}`);
    } catch (error) {
      console.error(error);
    }

    await interaction.reply({ embeds: [embed] });

    const dmChannel = (await user.createDM().catch(() => null)) as DMChannel | null;
    if (!dmChannel) return;
    if (user.bot) return;
    await dmChannel.send({ embeds: [embed.setTitle("Your warning has been removed.")] });
  }
}
