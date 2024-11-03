import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionType,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../utils/colorGen";
import {
  getSetting,
  setSetting,
  settingsDefinition,
  settingsKeys
} from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";

export default class Settings {
  data: SlashCommandBuilder;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("settings")
      .setDescription("Configure Sokora to your liking.")
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

    settingsKeys.forEach(key => {
      const subcommand = new SlashCommandSubcommandBuilder()
        .setName(key)
        .setDescription(settingsDefinition[key].description);

      Object.keys(settingsDefinition[key].settings).forEach(sub => {
        switch (settingsDefinition[key].settings[sub]["type"] as string) {
          case "BOOL":
            subcommand.addBooleanOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key].settings[sub]["desc"])
                .setRequired(false)
            );
            break;
          case "INTEGER":
            subcommand.addIntegerOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key].settings[sub]["desc"])
                .setRequired(false)
            );
            break;
          case "USER":
            subcommand.addUserOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key].settings[sub]["desc"])
                .setRequired(false)
            );
            break;
          // case "LIST":
          //   const subcommandGroup = new SlashCommandSubcommandGroupBuilder()
          //     .setName(sub)
          //     .setDescription("This subcommand group has no description.");
          default: // Also includes "TEXT"
            subcommand.addStringOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key].settings[sub]["desc"])
                .setRequired(false)
            );
            break;
        }
      });
      this.data.addSubcommand(subcommand);
    });
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    if (
      !guild.members.cache
        ?.get(interaction.user.id)
        ?.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Administrator** permission."
      );

    const key = interaction.options.getSubcommand() as keyof typeof settingsDefinition;
    const values = interaction.options.data[0].options!;
    if (!values.length) {
      const embed = new EmbedBuilder().setTitle(`Settings for ${key}`).setColor(genColor(100));
      const description: string[] = [];

      Object.keys(settingsDefinition[key]).forEach(name => {
        description.push(`${name}: ${getSetting(guild.id, key, name)?.toString() || "Not set"}`);
        embed.setDescription(description.join("\n"));
      });

      return await interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder().setTitle(`Parameters changed`).setColor(genColor(100));
    values.forEach(option => {
      setSetting(guild.id, key, option.name, option.value as string);
      embed.addFields({
        name: option.name,
        value: option.value?.toString() || "Not set"
      });
    });

    await interaction.reply({ embeds: [embed] });
  }

  async autocomplete(interaction: AutocompleteInteraction) {
    if (interaction.type != InteractionType.ApplicationCommandAutocomplete) return;
    //if (interaction.options.getSubcommand() != this.data.name) return;
    switch (Object.keys(settingsDefinition[interaction.options.getSubcommand()])[0]) {
      case "BOOL":
        await interaction.respond(
          ["true", "false"].map(choice => ({
            name: choice,
            value: choice
          }))
        );
        break;
      default:
        await interaction.respond([]);
    }
  }
}
