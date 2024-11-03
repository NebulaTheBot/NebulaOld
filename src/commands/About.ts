import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../utils/colorGen";
import { imageColor } from "../utils/imageColor";
import { randomise } from "../utils/randomise";

export default class About {
  data: SlashCommandBuilder;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("about")
      .setDescription("Shows information about Sokora.");
  }

  async run(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const user = client.user;
    const guilds = client.guilds.cache;
    const members = guilds.map(guild => guild.memberCount).reduce((a, b) => a + b);
    const shards = client.shard?.count;
    const avatar = user.displayAvatarURL();
    let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
    if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

    const embed = new EmbedBuilder()
      .setAuthor({ name: "•  About Sokora", iconURL: avatar })
      .setDescription(
        "Sokora is a multipurpose Discord bot that lets you manage your servers easily."
      )
      .setFields(
        {
          name: "📃 • General",
          value: [
            "Version **0.1**, *Kaishi*",
            `**${members}** members • **${guilds.size}** guild${guilds.size == 1 ? "" : "s"} ${
              !shards ? "" : `• **${shards}** shard${shards == 1 ? "" : "s"}`
            }`
          ].join("\n")
        },
        {
          name: "🌌 • Entities involved",
          value: [
            "**Founder**: Goos",
            "**Translator Lead**: ThatBOI",
            "**Developers**: Dimkauzh, Froxcey, Golem64, Koslz, MQuery, Nikkerudon, Spectrum, ThatBOI",
            "**Designers**: ArtyH, ZakaHaceCosas, Pjanda",
            "**Translators**: Dimkauzh, flojo, Golem64, GraczNet, Nikkerudon, ZakaHaceCosas, SaFire, TrulyBlue",
            "**Testers**: Blaze, fishy, Trynera",
            "And **YOU**, for using Sokora."
          ].join("\n")
        },
        {
          name: "🔗 • Links",
          value:
            "[GitHub](https://www.github.com/NebulaTheBot) • [YouTube](https://www.youtube.com/@NebulaTheBot) • [Instagram](https://instagram.com/NebulaTheBot) • [Mastodon](https://mastodon.online/@NebulaTheBot@mastodon.social) • [Guilded](https://guilded.gg/Nebula) • [Revolt](https://rvlt.gg/28TS9aXy)"
        }
      )
      .setFooter({ text: `Made with ${randomise(emojis)} by the Sokora team` })
      .setThumbnail(avatar)
      .setColor(user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(270));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("•  Donate")
        .setURL("https://paypal.me/SokoraTheBot")
        .setEmoji("⭐")
        .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}
