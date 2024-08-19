import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  TextChannel,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { deleteNews, get } from "../../utils/database/news";
import { getSetting } from "../../utils/database/settings";
import { errorEmbed } from "../../utils/embeds/errorEmbed";

export default class Remove {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Removes news from your guild.")
      .addStringOption(string =>
        string
          .setName("id")
          .setDescription("The ID of the news. Found in the footer of the news.")
          .setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const id = interaction.options.getString("id")!;
    const member = guild.members.cache.get(interaction.user.id)!;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Server** permission."
      );

    const news = get(id);
    if (!news) return await errorEmbed(interaction, "The specified news don't exist.");

    const messageID = news.messageID;
    const newsChannel = (await guild.channels
      .fetch((getSetting(guild.id, "news", "channel_id") as string) ?? interaction.channel?.id)
      .catch(() => null)) as TextChannel;

    if (newsChannel) await newsChannel.messages.delete(messageID);
    deleteNews(id);
    await interaction.reply({
      embeds: [new EmbedBuilder().setTitle("News removed.").setColor(genColor(100))]
    });
  }
}
