import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ActionRowBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
  type Role
} from "discord.js";
import { genColor } from "../utils/colorGen";
import { get as getLevelRewards } from "../utils/database/levelRewards";
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
    const reply = await interaction.reply({ embeds: [embed], components: [] });

    if (!getSetting(`${guild.id}`, "levelling.enabled" || selectedUser.bot)) return;
    const [guildExp, guildLevel] = getLevel(`${guild.id}`, `${target.id}`)!;
    if (!guildExp && !guildLevel) setLevel(`${guild.id}`, `${target.id}`, 0, 0);

    const formattedExpUntilLevelup = Math.floor(
      100 * 1.25 * ((guildLevel ?? 0) + 1)
    )?.toLocaleString("en-US");
    let rewards: (void | Role | null)[] = [];
    let nextReward;

    for (const { roleID, level } of getLevelRewards(`${guild.id}`)) {
      if (guildLevel < level) {
        if (nextReward) break;
        nextReward = { roleID, level };
        break;
      }

      rewards.push(await guild.roles.fetch(`${roleID}`)?.catch(() => {}));
    }

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

    reply.edit({ embeds: [embed], components: [row] });
    reply
      .createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 })
      .on("collect", async (i: ButtonInteraction) => {
        let testEmbed: EmbedBuilder = new EmbedBuilder();
        const levelEmbed = new EmbedBuilder()
          .setAuthor({
            name: `•  ${target.nickname ?? selectedUser.displayName}`,
            iconURL: target.displayAvatarURL()
          })
          .setFields({
            name: `⚡ • Level ${guildLevel ?? 0}`,
            value: [
              `**${guildExp.toLocaleString("en-US") ?? 0}/${formattedExpUntilLevelup}** EXP`,
              `**Next level**: ${(guildLevel ?? 0) + 1}`,
              `${
                rewards.length > 0
                  ? rewards.map(reward => `<@&${reward?.id}>`).join(" ")
                  : "*No rewards unlocked*"
              }`
            ].join("\n")
          })
          .setFooter({ text: `User ID: ${target.id}` })
          .setThumbnail(target.displayAvatarURL()!)
          .setColor(genColor(200));

        imageColor(levelEmbed, undefined, target);
        switch (i.customId) {
          case "general":
            testEmbed = embed;
          case "level":
            testEmbed = levelEmbed;
        }

        await reply.edit({ embeds: [testEmbed], components: [row] });
        i.update({});
      });
  }
}
