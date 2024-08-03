import {
  InteractionType,
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionsBitField,
  type ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandSubcommandBuilder
} from "discord.js";
import {
  getSetting,
  setSetting,
  settingsDefinition,
  settingsKeys
} from "../utils/database/settings";
import { genColor } from "../utils/colorGen";
import { errorEmbed } from "../utils/embeds/errorEmbed";

export default class Settings {
  data: SlashCommandBuilder; //Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("settings")
      .setDescription("Configure Sokora to your liking.")
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
    // .addStringOption(string =>
    //   string
    //     .setName("key")
    //     .setDescription("The setting key to set")
    //     .addChoices(...settingsKeys.map(key => ({ name: key, value: key })))
    //     .setRequired(true)
    // )
    // .addStringOption(string =>
    //   string
    //     .setName("value")
    //     .setDescription("The value you want to set this option to, or blank for view")
    //     .setAutocomplete(true)
    // );

    settingsKeys.forEach(key => {
      const subcommand = new SlashCommandSubcommandBuilder()
        .setName(key)
        .setDescription("This command has no description.");
      Object.keys(settingsDefinition[key]).forEach(sub => {
        switch (settingsDefinition[key][sub]["type"] as string) {
          case "BOOL":
            subcommand.addBooleanOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key][sub]["desc"])
                .setRequired(false)
            );
            break;
          case "INTEGER":
            subcommand.addIntegerOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key][sub]["desc"])
                .setRequired(false)
            );
            break;
          case "USER":
            subcommand.addUserOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key][sub]["desc"])
                .setRequired(false)
            );
            break;
          default: // Also includes "TEXT"
            subcommand.addStringOption(option =>
              option
                .setName(sub)
                .setDescription(settingsDefinition[key][sub]["desc"])
                .setRequired(false)
            );
            break;
        }
      });
      //console.log(subcommand);
      this.data.addSubcommand(subcommand);
    });
  }

  async run(interaction: ChatInputCommandInteraction) {
    if (
      !interaction.guild?.members.cache
        ?.get(interaction.member?.user.id!)
        ?.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Administrator** permission."
      );

    const key = interaction.options.getSubcommand() as keyof typeof settingsDefinition;
    const values = interaction.options.data[0].options!;
    console.log(values);
    if (values.length == 0) {
      const embed = new EmbedBuilder();
      embed.setTitle(`Settings for ${key}`);
      embed.setColor(genColor(100));
      Object.keys(settingsDefinition[key]).forEach(name => {
        embed.addFields({
          name: name,
          value: getSetting(interaction.guildId!, key, name)?.toString() || "Not set"
        });
      });
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder().setTitle(`Parameters changed`).setColor(genColor(100));
    values.forEach(option => {
      setSetting(interaction.guildId!, key, option.name, option.value as string);
      embed.addFields({
        name: option.name,
        value: option.value?.toString() || "Not set"
      });
    });

    interaction.reply({ embeds: [embed] });
  }

  async autocomplete(interaction: AutocompleteInteraction) {
    if (interaction.type != InteractionType.ApplicationCommandAutocomplete) return;
    //if (interaction.options.getSubcommand() != this.data.name) return;
    switch (Object.keys(settingsDefinition[interaction.options.getSubcommand()])[0]) {
      case "BOOL":
        interaction.respond(
          ["true", "false"].map(choice => ({
            name: choice,
            value: choice
          }))
        );
        break;
      default:
        interaction.respond([]);
    }
  }
}
