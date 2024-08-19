import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type Role,
  type TextChannel
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { get, updateNews } from "../../utils/database/news";
import { getSetting } from "../../utils/database/settings";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { sendChannelNews } from "../../utils/sendChannelNews";

export default class Edit {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("edit")
      .setDescription("Edits the news of your guild.")
      .addStringOption(string =>
        string
          .setName("id")
          .setDescription("The ID of the news you want to edit.")
          .setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    if (
      !interaction
        .guild!.members.cache.get(interaction.user.id)!
        .permissions.has(PermissionsBitField.Flags.ManageGuild)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Server** permission."
      );

    const guild = interaction.guild!;
    const id = interaction.options.getString("id", true).trim();
    const news = get(id);
    if (!news) return await errorEmbed(interaction, "The specified news don't exist.");

    const editModal = new ModalBuilder()
      .setCustomId("editnews")
      .setTitle(`Edit news: ${news.title}`);

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setPlaceholder("Title")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setLabel("Title")
      .setValue(news.title)
      .setRequired(true);

    const bodyInput = new TextInputBuilder()
      .setCustomId("body")
      .setPlaceholder("Content (markdown)")
      .setMaxLength(4000)
      .setStyle(TextInputStyle.Paragraph)
      .setLabel("Content (markdown)")
      .setValue(news.body)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(
      titleInput
    ) as ActionRowBuilder<TextInputBuilder>;
    const secondActionRow = new ActionRowBuilder().addComponents(
      bodyInput
    ) as ActionRowBuilder<TextInputBuilder>;

    editModal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(editModal).catch(err => console.error(err));
    interaction.client.once("interactionCreate", async i => {
      if (!i.isModalSubmit()) return;

      const role = getSetting(guild.id, "news", "role_id") as string;
      let roleToSend: Role | undefined;
      if (role) roleToSend = guild.roles.cache.get(role);
      const title = i.fields.getTextInputValue("title");
      const body = i.fields.getTextInputValue("body");
      const newsEditable = getSetting(guild.id, "news", "edit_original_message");
      if (newsEditable === false) await sendChannelNews(guild, id, interaction, title, body);

      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${news.author}`, iconURL: news.authorPFP })
        .setTitle(title)
        .setDescription(body)
        .setTimestamp(parseInt(news.updatedAt.toString()) ?? null)
        .setFooter({ text: `Edited news from ${guild.name}\nID: ${news.id}` })
        .setColor(genColor(200));

      (
        guild.channels.cache.get(
          (getSetting(guild.id, "news", "channel_id") as string) ?? interaction.channel?.id
        ) as TextChannel
      )?.messages.edit(news.messageID, {
        embeds: [embed],
        content: roleToSend ? `<@&${roleToSend.id}>` : undefined
      });

      updateNews(id, title, body);
      await interaction.reply({
        embeds: [new EmbedBuilder().setTitle("News edited.").setColor(genColor(100))]
      });
    });
  }
}
