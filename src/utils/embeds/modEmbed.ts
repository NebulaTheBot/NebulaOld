import { EmbedBuilder, type ChatInputCommandInteraction, type User } from "discord.js";
import ms from "ms";
import { genColor } from "../colorGen";
import { logChannel } from "../logChannel";
import { errorEmbed } from "./errorEmbed";

type Options = {
  interaction: ChatInputCommandInteraction;
  user: User;
  action: string;
  duration?: string | null;
};

export async function errorCheck(permission: bigint, options: Options, permissionAction?: string) {
  const { interaction, user, action } = options;
  const guild = interaction.guild!;
  const members = guild.members.cache!;
  const member = members.get(interaction.member?.user.id!)!;
  const target = members.get(user.id)!;
  const name = user.displayName;

  if (!member.permissions.has(permission))
    return errorEmbed(
      interaction,
      "You can't execute this command.",
      `You need the **${permissionAction ?? action} Members** permission.`
    );

  if (target === member)
    return errorEmbed(interaction, `You can't ${action.toLowerCase()} yourself.`);

  if (target.user.id === interaction.client.user.id)
    return errorEmbed(interaction, `You can't ${action.toLowerCase()} Sokora.`);

  if (!target.manageable)
    return errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      "The member has a higher role position than Sokora."
    );

  if (member.roles.highest.position < target.roles.highest.position)
    return errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      "The member has a higher role position than you."
    );

  if (member.id === guild.ownerId)
    return errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      "The member owns the server."
    );
}

export async function modEmbed(options: Options, reason?: string | null) {
  const { interaction, user, action, duration } = options;
  const guild = interaction.guild!;
  const name = user.displayName;

  const generalValues = [`**Moderator**: ${interaction.user.displayName}`];
  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  if (reason) generalValues.push(`**Reason**: ${reason}`);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${name}`, iconURL: user.displayAvatarURL() })
    .setTitle(`${action} ${name}.`)
    .setDescription(generalValues.join("\n"))
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(100));

  await logChannel(guild, embed);
  await interaction.reply({ embeds: [embed] });

  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel) return;
  if (user.bot) return;
  await dmChannel
    .send({
      embeds: [embed.setTitle(`You got ${action.toLowerCase()}.`).setColor(genColor(0))]
    })
    .catch(() => null);
}
