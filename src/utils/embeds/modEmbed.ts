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

type ErrorOptions = {
  allErrors: boolean;
  botError: boolean;
  ownerError: boolean;
};

export async function errorCheck(
  permission: bigint,
  options: Options,
  errorOptions: ErrorOptions,
  permissionAction: string
) {
  const { interaction, user, action } = options;
  const { allErrors, botError, ownerError } = errorOptions;
  const guild = interaction.guild!;
  const members = guild.members.cache!;
  const member = members.get(interaction.member?.user.id!)!;
  const client = members.get(interaction.client.user.id!)!;
  const target = members.get(user.id)!;
  const name = user.displayName;

  if (botError)
    if (!client.permissions.has(permission))
      return errorEmbed(
        interaction,
        "The bot can't execute this command.",
        `The bot is missing the **${permissionAction}** permission.`
      );

  if (!member.permissions.has(permission))
    return errorEmbed(
      interaction,
      "You can't execute this command.",
      `You're missing the **${permissionAction} Members** permission.`
    );

  if (!allErrors) return;
  if (!target) return;
  if (target === member)
    return errorEmbed(interaction, `You can't ${action.toLowerCase()} yourself.`);

  if (target.id === interaction.client.user.id)
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

  if (ownerError) {
    if (target.id === guild.ownerId)
      return errorEmbed(
        interaction,
        `You can't ${action.toLowerCase()} ${name}.`,
        "The member owns the server."
      );
  }
}

export async function modEmbed(options: Options, reason?: string | null, date?: boolean) {
  const { interaction, user, action, duration } = options;
  const guild = interaction.guild!;
  const name = user.displayName;

  const generalValues = [`**Moderator**: ${interaction.user.displayName}`];
  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  if (reason) generalValues.push(`**Reason**: ${reason}`);
  if (date) generalValues.push(`**Date**: <t:${Math.floor(Date.now() / 1000)}:f>`);

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
  if (!guild.members.cache.get(user.id)) return;
  if (user.bot) return;
  await dmChannel
    .send({
      embeds: [embed.setTitle(`You got ${action.toLowerCase()}.`).setColor(genColor(0))]
    })
    .catch(() => null);
}
