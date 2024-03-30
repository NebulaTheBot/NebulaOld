import {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
  type ChatInputCommandInteraction
} from "discord.js";
import { serverEmbed } from "../utils/embeds/serverEmbed";
import { listPublicServers } from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";

export default class Serverboard {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("serverboard")
      .setDescription("Shows the servers that have Sokora.")
      .addNumberOption(number =>
        number.setName("page").setDescription("The page you want to see.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guildList = (
      await Promise.all(listPublicServers().map(id => interaction.client.guilds.fetch(id)))
    ).sort((a, b) => b.memberCount - a.memberCount);

    const pages = guildList.length;
    if (pages == 0)
      return errorEmbed(
        interaction,
        "No public server found",
        "By some magical miracle, all the servers using Sokora turned off their visibility. Use /settings key:`serverboard.shown` value:`TRUE` to make your server publicly visible."
      );

    const argPage = interaction.options.get("page")?.value as number;
    let page = (argPage - 1 <= 0 ? 0 : argPage - 1 > pages ? pages - 1 : argPage - 1) || 0;

    async function getEmbed() {
      return await serverEmbed({ guild: guildList[page], page: page + 1, pages, showInvite: true });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("left")
        .setEmoji("1137330341472915526")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("right")
        .setEmoji("1137330125004869702")
        .setStyle(ButtonStyle.Primary)
    );

    const reply = await interaction.reply({ embeds: [await getEmbed()], components: [row] });
    reply
      .createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 })
      .on("collect", async (i: ButtonInteraction) => {
        switch (i.customId) {
          case "left":
            page--;
            if (page < 0) page = pages - 1;
          case "right":
            page++;
            if (page >= pages) page = 0;
        }

        await reply.edit({ embeds: [await getEmbed()], components: [row] });
        i.update({});
      });
  }
}
