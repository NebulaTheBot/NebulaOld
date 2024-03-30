import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { listAllNews } from "../../utils/database/news";

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
    let currentNews = sortedNews[page - 1];

    if (!news || !sortedNews || sortedNews.length == 0)
      return errorEmbed(
        interaction,
        "No news found.",
        "Admins can add news with the **/news send** command."
      );

    if (page > sortedNews.length) page = sortedNews.length;
    if (page < 1) page = 1;

    let embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${currentNews.author}`, iconURL: currentNews.authorPFP })
      .setTitle(currentNews.title)
      .setDescription(currentNews.body)
      .setImage(currentNews.imageURL || null)
      .setTimestamp(parseInt(currentNews.updatedAt))
      .setFooter({ text: `Page ${page} of ${sortedNews.length} • ID: ${currentNews.id}` })
      .setColor(genColor(200));

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

    await interaction.reply({ embeds: [embed], components: [row] });
    interaction.channel
      ?.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
      })
      .on("collect", async i => {
        if (!i.isButton()) return;
        if (i.user.id !== interaction.user.id) {
          errorEmbed(
            interaction,
            "No.",
            "You have not sent this command. Type **/news view** to view news yourself."
          );
          return;
        }

        if (i.customId === "left") {
          page--;
          if (page < 1) page = sortedNews.length;
        } else if (i.customId === "right") {
          page++;
          if (page > sortedNews.length) page = 1;
        }

        currentNews = sortedNews[page - 1];
        embed = new EmbedBuilder()
          .setAuthor({ name: `•  ${currentNews.author}`, iconURL: currentNews.authorPFP })
          .setTitle(currentNews.title)
          .setDescription(currentNews.body)
          .setImage(currentNews.imageURL || null)
          .setTimestamp(parseInt(currentNews.updatedAt))
          .setFooter({ text: `Page ${page} of ${sortedNews.length} • ID: ${currentNews.id}` })
          .setColor(genColor(200));

        await interaction.editReply({ embeds: [embed], components: [row] });
        await i.deferUpdate();
      });
  }
}
