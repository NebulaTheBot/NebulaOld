import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { addNews, listAllQuery } from "../../utils/database/news";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { sendChannelNews } from "../../utils/sendChannelNews";

export default class Add {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder().setName("add").setDescription("Add your news.");
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    if (
      !guild.members.cache
        .get(interaction.user.id)
        ?.permissions.has(PermissionsBitField.Flags.ManageGuild)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Server** permission."
      );

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("title")
        .setPlaceholder("Write a title")
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short)
        .setLabel("Title")
        .setRequired(true)
    );

    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("body")
        .setPlaceholder("Insert your content here")
        .setMaxLength(4000)
        .setStyle(TextInputStyle.Paragraph)
        .setLabel("Content (supports Markdown)")
        .setRequired(true)
    );

    const newsModal = new ModalBuilder()
      .setCustomId("addnews")
      .setTitle("Write your news.")
      .addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(newsModal).catch(err => console.error(err));
    interaction.client.once("interactionCreate", async i => {
      if (!i.isModalSubmit()) return;

      const id = (listAllQuery.all(guild.id).length + 1).toString();
      addNews(
        guild.id,
        i.fields.getTextInputValue("title"),
        i.fields.getTextInputValue("body"),
        i.user.displayName,
        i.user.avatarURL()!,
        null!,
        id
      );

      await sendChannelNews(guild, id, interaction).catch(err => console.error(err));
      await i.reply({
        embeds: [new EmbedBuilder().setTitle("News added.").setColor(genColor(100))],
        ephemeral: true
      });
    });
  }
}
