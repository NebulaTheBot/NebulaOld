import { EmbedBuilder, type ChatInputCommandInteraction, type ButtonInteraction } from "discord.js";
import { genColor } from "../colorGen";

/**
 * Sends the embed containing an error.
 * @param interaction The interaction (slash command).
 * @param title The error.
 * @param reason The reason of the error.
 * @returns Embed with the error description.
 */
export async function errorEmbed(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  title: string,
  reason?: string
) {
  const content = [`**${title}**`];
  if (reason != undefined) content.push(reason);
  const embed = new EmbedBuilder()
    .setTitle("Something went wrong!")
    .setDescription(content.join("\n"))
    .setColor(genColor(0));

  if (interaction.replied) return await interaction.followUp({ embeds: [embed], ephemeral: true });
  return await interaction.reply({ embeds: [embed], ephemeral: true });
}
