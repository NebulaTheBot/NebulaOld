import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { listAllNews } from "../../utils/database/news";
import { errorEmbed } from "../../utils/embeds/errorEmbed";

export default class View {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("View the news of this server.")
      .addNumberOption(number =>
        number.setName("page").setDescription("The page of the news that you want to see.")
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    let page = interaction.options.getNumber("page") ?? 1;
    const news = listAllNews(interaction.guild?.id!);
    const sortedNews = (Object.values(news) as any[])?.sort((a, b) => b.createdAt - a.createdAt);

    if (!news || !sortedNews || !sortedNews.length)
      return await errorEmbed(
        interaction,
        "No news found.",
        "Admins can add news with the **/news add** command."
      );

    if (page > sortedNews.length) page = sortedNews.length;
    if (page < 1) page = 1;

    function getEmbed() {
      const currentNews = sortedNews[page - 1];
      return new EmbedBuilder()
        .setAuthor({ name: `•  ${currentNews.author}`, iconURL: currentNews.authorPFP })
        .setTitle(currentNews.title)
        .setDescription(currentNews.body)
        .setImage(currentNews.imageURL || null)
        .setTimestamp(parseInt(currentNews.updatedAt))
        .setFooter({ text: `Page ${page} of ${sortedNews.length} • ID: ${currentNews.id}` })
        .setColor(genColor(200));
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("left")
        .setEmoji("1298708251256291379")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("right")
        .setEmoji("1298708281493160029")
        .setStyle(ButtonStyle.Primary)
    );

    const reply = await interaction.reply({ embeds: [getEmbed()], components: [row] });
    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on("collect", async (i: ButtonInteraction) => {
      if (i.message.id != (await reply.fetch()).id)
        return await errorEmbed(
          i,
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that."
        );

      if (i.user.id != interaction.user.id)
        return await errorEmbed(i, "You aren't the person who executed this command.");

      switch (i.customId) {
        case "left":
          page--;
          if (page < 1) page = sortedNews.length;
          await i.update({ embeds: [getEmbed()], components: [row] });
          break;
        case "right":
          page++;
          if (page > sortedNews.length) page = 1;
          await i.update({ embeds: [getEmbed()], components: [row] });
          break;
      }
    });

    collector.on("end", async () => await interaction.editReply({ components: [] }));
  }
}
