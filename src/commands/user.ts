import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ActionRowBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { getLevel, setLevel } from "../utils/database/levelling";
import { imageColor } from "../utils/imageColor";

export default class User {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("user")
      .setDescription("Shows your (or another user's) info.")
      .addUserOption(user => user.setName("user").setDescription("Select the user."));
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const user = interaction.options.getUser("user");
    const id = user ? user.id : interaction.member?.user.id;
    const target = guild.members.cache
      .filter(member => member.user.id === id)
      .map(user => user)[0]!;

    const selectedUser = target.user!;
    let serverInfo = [`Joined on **<t:${Math.round(target.joinedAt?.valueOf()! / 1000)}:D>**`];
    const guildRoles = guild.roles.cache.filter(role => target.roles.cache.has(role.id))!;
    const memberRoles = [...guildRoles].sort(
      (role1, role2) => role2[1].position - role1[1].position
    );
    memberRoles.pop();

    if (target.premiumSinceTimestamp != null)
      serverInfo.push(`Boosting since **${target.premiumSinceTimestamp}**`);

    if (memberRoles.length !== 0)
      serverInfo.push(
        `**${guildRoles.filter(role => target.roles.cache.has(role.id)).size! - 1}** ${
          memberRoles.length === 1 ? "role" : "roles"
        } • ${memberRoles
          .slice(0, 5)
          .map(role => `<@&${role[1].id}>`)
          .join(", ")}${memberRoles.length > 3 ? ` **and ${memberRoles.length - 4} more**` : ""}`
      );

    let embed = new EmbedBuilder()
      .setAuthor({
        name: `•  ${target.nickname ?? selectedUser.displayName}`,
        iconURL: target.displayAvatarURL()
      })
      .setFields(
        {
          name: `<:realdiscord:1221878641462345788> • Discord info`,
          value: [
            `Username is **${selectedUser.username}**`,
            `Display name is ${
              selectedUser.displayName === selectedUser.username
                ? "*not there*"
                : `**${selectedUser.displayName}**`
            }`,
            `Created on **<t:${Math.round(selectedUser.createdAt.valueOf() / 1000)}:D>**`
          ].join("\n")
        },
        {
          name: "📒 • Server info",
          value: serverInfo.join("\n")
        }
      )
      .setFooter({ text: `User ID: ${target.id}` })
      .setThumbnail(target.displayAvatarURL()!)
      .setColor(genColor(200));

    imageColor(embed, undefined, target);
    await interaction.reply({ embeds: [embed], components: [] });

    if (!getSetting(`${guild.id}`, "levelling.enabled" || selectedUser.bot)) return;
    const [guildLevel, guildExp] = getLevel(`${guild.id}`, `${target.id}`)!;
    const [globalLevel, globalExp] = getLevel("0", `${target.id}`)!;
    if (!guildLevel && !guildExp) setLevel(`${guild.id}`, `${target.id}`, 0, 0);
    if (!globalLevel && !globalExp) setLevel("0", `${target.id}`, 0, 0);

    const nextLevelExp = Math.floor(100 * 1.15 * ((guildLevel ?? 0) + 1))?.toLocaleString("en-US");
    const globalNextLevelExp = Math.floor(100 * 1.15 * ((globalLevel ?? 0) + 1))?.toLocaleString(
      "en-US"
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("general")
        .setLabel("•  General")
        .setEmoji("📃")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("level")
        .setLabel("•  Level")
        .setEmoji("⚡")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
    interaction.channel
      ?.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
      })
      .on("collect", async (i: ButtonInteraction) => {
        const levelEmbed = new EmbedBuilder()
          .setAuthor({
            name: `•  ${target.nickname ?? selectedUser.displayName}`,
            iconURL: target.displayAvatarURL()
          })
          .setFields(
            {
              name: `⚡ • Guild level ${guildLevel ?? 0}`,
              value: [
                `**${guildExp.toLocaleString("en-US") ?? 0}/${nextLevelExp}** EXP`,
                `**Next level**: ${(guildLevel ?? 0) + 1}`
              ].join("\n"),
              inline: true
            },
            {
              name: `⛈️ • Global level ${globalLevel ?? 0}`,
              value: [
                `**${globalExp.toLocaleString("en-US") ?? 0}/${globalNextLevelExp}** EXP`,
                `**Next level**: ${(globalLevel ?? 0) + 1}`
              ].join("\n"),
              inline: true
            }
          )
          .setFooter({ text: `User ID: ${target.id}` })
          .setThumbnail(target.displayAvatarURL())
          .setColor(genColor(200));

        imageColor(levelEmbed, undefined, target);
        switch (i.customId) {
          case "general":
            await interaction.editReply({ embeds: [embed], components: [row] });
          case "level":
            await interaction.editReply({ embeds: [levelEmbed], components: [row] });
        }

        i.update({});
      });
  }
}
