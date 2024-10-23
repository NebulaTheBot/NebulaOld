import { file } from "bun";
import type { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import { join } from "path";
import { pathToFileURL } from "url";
import { capitalize } from "../utils/capitalize";

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

export default {
  name: "interactionCreate",
  event: class InteractionCreate {
    commands: CommandInteraction;
    client: Client;
    constructor(cmds: CommandInteraction, client: Client) {
      this.commands = cmds;
      this.client = client;
    }

    async run(interaction: CommandInteraction | AutocompleteInteraction) {
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
    }
  }
};
