import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { genColor } from "../utils/colorGen";
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
    const guilds = client.guilds.cache;
    const members = guilds.map(guild => guild.memberCount).reduce((a, b) => a + b);
    const shards = client.shard?.count;
    let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
    if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

    const embed = new EmbedBuilder()
      .setAuthor({ name: "•  About Sokora", iconURL: client.user.displayAvatarURL() })
      .setDescription(
        "Sokora is a multipurpose Discord bot that lets you manage your servers easily."
      )
      .setFields(
        {
          name: "📃 • General",
          value: [
            "**Version** 0.1, *the Antei update*",
            `**${members}** members • **${guilds.size}** guild${guilds.size === 1 ? "" : "s"} ${
              shards == undefined ? "" : `• **${shards}** shard${shards === 1 ? "" : "s"}`
            }`
          ].join("\n")
        },
        {
          name: "🌌 • Entities involved",
          value: [
            "**Head developer**: Goos",
            "**Developers**: Dimkauzh, Froxcey, Golem64, Spectrum, ThatBOI",
            "**Designers**: ArtyH, Optix, proJM, Slider_on_the_black",
            "**Translators**: Dimkauzh, Golem64, Optix, SaFire, ThatBOI, Trynera",
            "**Testers**: Blaze, fishy, flojo, Trynera",
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
      .setThumbnail(client.user.displayAvatarURL())
      .setColor(genColor(270));

    await interaction.reply({ embeds: [embed] });
  }
}
