import { file } from "bun";
import type { AutocompleteInteraction, CommandInteraction } from "discord.js";
import { join } from "path";
import { pathToFileURL } from "url";
import { capitalize } from "../utils/capitalize";
import { Event } from "../utils/types";

async function getCommand(
  interaction: CommandInteraction | AutocompleteInteraction,
  options: any
): Promise<any> {
  const commandName = capitalize(interaction.commandName)!;
  const subcommandName = capitalize(options.getSubcommand(false));
  const commandGroupName = capitalize(options.getSubcommandGroup(false));
  let commandImportPath = join(
    join(process.cwd(), "src", "commands"),
    `${
      subcommandName
        ? `${commandName.toLowerCase()}/${
            commandGroupName ? `${commandGroupName}/${subcommandName}` : subcommandName
          }`
        : commandName
    }.ts`
  );

  if (!(await file(commandImportPath).exists()))
    commandImportPath = join(join(process.cwd(), "src", "commands", `${commandName}.ts`));

  return new (await import(pathToFileURL(commandImportPath).toString())).default();
}

export default (async function run(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = await getCommand(interaction, interaction.options);
    if (!command) return;
    if (command.deferred) await interaction.deferReply();
    command.run(interaction);
  } else if (interaction.isAutocomplete()) {
    const command = await getCommand(interaction, interaction.options);
    if (!command) return;
    if (!command.autocomplete) return;
    command.autocomplete(interaction);
  }
} as Event<"interactionCreate">);
