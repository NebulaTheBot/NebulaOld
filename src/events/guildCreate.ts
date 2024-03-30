import { EmbedBuilder, type DMChannel, type Client, type Guild } from "discord.js";
import { genColor } from "../utils/colorGen";
import { randomise } from "../utils/randomise";
import Commands from "../handlers/commands";

export default {
  name: "guildCreate",
  event: class GuildCreate {
    client: Client;
    constructor(client: Client) {
      this.client = client;
    }

    async run(guild: Guild) {
      const dmChannel = (await (await guild.fetchOwner())
        .createDM()
        .catch(() => null)) as DMChannel | undefined;

      let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
      if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

      const embed = new EmbedBuilder()
        .setTitle("Welcome to Sokora!")
        .setDescription(
          [
            "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
            "To manage the bot, use the **/settings** command.",
            "Sokora is in an early stage of development. If you find bugs, please go to our [official server](https://discord.gg/c6C25P4BuY) and report them."
          ].join("\n\n")
        )
        .setFooter({ text: `Made with ${randomise(emojis)} by the Sokora team` })
        .setColor(genColor(200));

      await new Commands(guild.client).registerCommandsForGuild(guild);
      if (dmChannel) await dmChannel.send({ embeds: [embed] });
    }
  }
};
