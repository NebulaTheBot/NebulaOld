import { EmbedBuilder, inlineCode, type ChatInputCommandInteraction, type User } from "discord.js";
import ms from "ms";
import { genColor } from "../colorGen";
import { addModeration, type modType } from "../database/moderation";
import { logChannel } from "../logChannel";
import { errorEmbed } from "./errorEmbed";

type Options = {
  interaction: ChatInputCommandInteraction;
  user: User;
  action: string;
  duration?: string | null;
  dm?: boolean;
  dbAction?: modType;
  expiresAt?: number;
};

type ErrorOptions = {
  allErrors: boolean;
  botError: boolean;
  ownerError?: boolean;
  outsideError?: boolean;
};

export async function errorCheck(
  permission: bigint,
  options: Options,
  errorOptions: ErrorOptions,
  permissionAction: string
) {
  const { interaction, user, action } = options;
  const { allErrors, botError, ownerError, outsideError } = errorOptions;
  const guild = interaction.guild!;
  const members = guild.members.cache!;
  const member = members.get(interaction.user.id)!;
  const client = members.get(interaction.client.user.id)!;
  const target = members.get(user.id)!;
  const name = user.displayName;

  if (botError)
    if (!client.permissions.has(permission))
      return await errorEmbed(
        interaction,
        "The bot can't execute this command.",
        `The bot is missing the **${permissionAction}** permission.`
      );

  if (!member.permissions.has(permission))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      `You're missing the **${permissionAction} Members** permission.`
    );

  if (!allErrors) return;
  if (!target) return;
  if (target == member)
    return await errorEmbed(interaction, `You can't ${action.toLowerCase()} yourself.`);

  if (target.id == interaction.client.user.id)
    return await errorEmbed(interaction, `You can't ${action.toLowerCase()} Sokora.`);

  if (!target.manageable)
    return await errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      "The member has a higher role position than Sokora."
    );

  if (member.roles.highest.position < target.roles.highest.position)
    return await errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      "The member has a higher role position than you."
    );

  if (ownerError) {
    if (target.id == guild.ownerId)
      return await errorEmbed(
        interaction,
        `You can't ${action.toLowerCase()} ${name}.`,
        "The member owns the server."
      );
  }

  if (outsideError) {
    if (
      !(await guild.members
        .fetch(user.id)
        .then(() => true)
        .catch(() => false))
    )
      return await errorEmbed(
        interaction,
        `You can't ${action.toLowerCase()} ${name}.`,
        "This user isn't in this server."
      );
  }
}

export async function modEmbed(
  options: Options,
  reason?: string | null,
  showModerator: boolean = false
) {
  const { interaction, user, action, duration, dm, dbAction, expiresAt } = options;
  const guild = interaction.guild!;
  const name = user.displayName;
  const generalValues = [`Responsible moderator is **${interaction.user.displayName}**`];
  reason
    ? generalValues.push(`**Reason** provided is ${inlineCode(reason)}`)
    : generalValues.push("*No reason provided*");

  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  const footer = [`User ID: ${user.id}`];
  if (dbAction) {
    try {
      const id = addModeration(
        guild.id,
        user.id,
        dbAction,
        guild.members.cache.get(interaction.user.id)?.id!,
        reason ?? undefined,
        expiresAt ?? undefined
      );
      footer.push(`Case ID: ${id}`);
    } catch (error) {
      console.error(error);
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${action} ${name}`, iconURL: user.displayAvatarURL() })
    .setDescription(generalValues.join("\n"))
    .setFooter({ text: footer.join("\n") })
    .setColor(genColor(100));

  await logChannel(guild, embed);
  if (interaction.replied) await interaction.followUp({ embeds: [embed] });
  else await interaction.reply({ embeds: [embed] });

  if (!dm) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel || !guild.members.cache.get(user.id) || user.bot) return;
  await dmChannel
    .send({
      embeds: [
        embed
          .setTitle(`You got ${action.toLowerCase()}.`)
          .setDescription(generalValues.slice(+!showModerator, generalValues.length).join("\n"))
          .setColor(genColor(0))
      ]
    })
    .catch(() => null);
}
