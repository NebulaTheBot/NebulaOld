import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { serverEmbed } from "../utils/embeds/serverEmbed";

export default class Server {
  data: SlashCommandBuilder;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("server")
      .setDescription("Shows this server's info.");
  }

  async run(interaction: ChatInputCommandInteraction) {
    const embed = await serverEmbed({ guild: interaction.guild!, roles: true });
    await interaction.reply({ embeds: [embed] });
  }
}
