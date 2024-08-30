import {
  DMChannel,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { listUserModeration, removeModeration } from "../../utils/database/moderation";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck } from "../../utils/embeds/modEmbed";
import { logChannel } from "../../utils/logChannel";

export default class Delwarn {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("delwarn")
      .setDescription("Removes a warning from a user.")
      .addUserOption(user =>
        user
          .setName("user")
          .setDescription("The user that you want to free from the warning.")
          .setRequired(true)
      )
      .addNumberOption(number =>
        number.setName("id").setDescription("The id of the warn.").setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user")!;
    const guild = interaction.guild!;
    const name = user.displayName;
    const id = interaction.options.getNumber("id");
    const warns = listUserModeration(guild.id, user.id, "WARN");
    const newWarns = warns.filter(warn => warn.id != `${id}`);

    await errorCheck(
      PermissionsBitField.Flags.ModerateMembers,
      { interaction, user, action: "Remove a warn" },
      { allErrors: true, botError: false, ownerError: false },
      "Moderate Members"
    );

    if (newWarns.length == warns.length)
      return await errorEmbed(interaction, `There is no warn with the id of ${id}.`);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  ${name}`, iconURL: user.displayAvatarURL() })
      .setTitle(`Removed a warning from ${name}.`)
      .setDescription(`**Moderator**: ${interaction.user.displayName}`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `User ID: ${user.id}` })
      .setColor(genColor(100));

    await logChannel(guild, embed);
    try {
      removeModeration(guild.id, `${id}`);
    } catch (error) {
      console.error(error);
    }

    await interaction.reply({ embeds: [embed] });

    const dmChannel = (await user.createDM().catch(() => null)) as DMChannel | null;
    if (!dmChannel) return;
    if (user.bot) return;
    await dmChannel.send({ embeds: [embed.setTitle("Your warning has been removed.")] });
  }
}
