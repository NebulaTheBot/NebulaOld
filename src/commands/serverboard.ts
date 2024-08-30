import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import { listPublicServers } from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { serverEmbed } from "../utils/embeds/serverEmbed";

export default class Serverboard {
  data: SlashCommandOptionsOnlyBuilder;
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
    if (!pages)
      return await errorEmbed(
        interaction,
        "No public server found.",
        "By some magical miracle, all the servers using Sokora turned off their visibility. Use /settings serverboard `shown: True` to make your server publicly visible."
      );

    const argPage = interaction.options.getNumber("page") as number;
    let page = (argPage - 1 <= 0 ? 0 : argPage - 1 > pages ? pages - 1 : argPage - 1) || 0;
    const embed = await serverEmbed({ guild: guildList[page], page: page + 1, pages });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("left")
        .setEmoji("1271045078042935398")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("right")
        .setEmoji("1271045041313415370")
        .setStyle(ButtonStyle.Primary)
    );

    const reply = await interaction.reply({ embeds: [embed], components: [row] });
    reply
      .createMessageComponentCollector({ time: 60000 })
      .on("collect", async (i: ButtonInteraction) => {
        if (i.message.id != (await reply.fetch()).id)
          return await errorEmbed(
            i,
            "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that."
          );

        if (i.user.id != interaction.user.id)
          return await errorEmbed(i, "You aren't the person who executed this command.");

        setTimeout(async () => await i.update({ components: [] }), 60000);
        switch (i.customId) {
          case "left":
            page--;
            if (page < 0) page = pages - 1;
          case "right":
            page++;
            if (page >= pages) page = 0;
        }

        await i.update({ embeds: [embed], components: [row] });
      });
  }
}
