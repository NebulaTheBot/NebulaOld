/**
 * Sends an embed containing information about the guild.
 * @param options Options of the embed.
 * @returns Embed that contains the guild info.
 */

import { EmbedBuilder, type Guild } from "discord.js";
import { genColor } from "../colorGen";
import { imageColor } from "../imageColor";

type Options = {
  guild: Guild;
  roles?: boolean;
  page?: number;
  pages?: number;
};

export async function serverEmbed(options: Options) {
  const { page, pages, guild } = options;
  const { premiumTier: boostTier, premiumSubscriptionCount: boostCount } = guild;
  const members = guild.members.cache;
  const boosters = members.filter(member => member.premiumSince);
  const onlineMembers = members.filter(member =>
    ["online", "dnd", "idle"].includes(member.presence?.status!)
  ).size;
  const bots = members.filter(member => member.user.bot);
  const formattedUserCount = (guild.memberCount - bots.size)?.toLocaleString("en-US");
  const icon = guild.iconURL();

  const roles = guild.roles.cache;
  const sortedRoles = [...roles].sort((role1, role2) => role2[1].position - role1[1].position);
  sortedRoles.pop();
  const rolesLength = sortedRoles.length;

  const channels = guild.channels.cache;
  const channelSizes = {
    text: channels.filter(channel => channel.type == 0 || channel.type == 15 || channel.type == 5)
      .size,
    voice: channels.filter(channel => channel.type == 2 || channel.type == 13).size,
    categories: channels.filter(channel => channel.type == 4).size
  };

  const generalValues = [
    `Owned by **${(await guild.fetchOwner()).user.displayName}**`,
    `Created on **<t:${Math.round(guild.createdAt.valueOf() / 1000)}:D>**`
  ];

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pages ? `#${page}  •  ` : icon ? "•  " : ""}${guild.name}`,
      iconURL: icon!
    })
    .setDescription(guild.description ? guild.description : null)
    .setFields({ name: "📃 • General", value: generalValues.join("\n") })
    .setFooter({ text: `${pages ? `Page ${page}/${pages}\n` : ""}Server ID: ${guild.id}` })
    .setThumbnail(icon)
    .setColor((await imageColor(guild)) ?? genColor(200));

  if (options.roles)
    embed.addFields({
      name: `🎭 • ${roles.size - 1} ${roles.size == 1 ? "role" : "roles"}`,
      value:
        roles.size == 1
          ? "*None*"
          : `${sortedRoles
              .slice(0, 5)
              .map(role => `<@&${role[0]}>`)
              .join(", ")}${rolesLength > 5 ? ` and **${rolesLength - 5}** more` : ""}`
    });

  embed.addFields(
    {
      name: `👥 • ${guild.memberCount?.toLocaleString("en-US")} members`,
      value: [
        `**${formattedUserCount}** users • **${bots.size?.toLocaleString("en-US")}** bots`,
        `**${onlineMembers?.toLocaleString("en-US")}** online`
      ].join("\n"),
      inline: true
    },
    {
      name: `🗨️ • ${channelSizes.text + channelSizes.voice} channels`,
      value: [
        `**${channelSizes.text}** text • **${channelSizes.voice}** voice`,
        `**${channelSizes.categories}** categories`
      ].join("\n"),
      inline: true
    },
    {
      name: `🌟 • ${!boostTier ? "No level" : `Level ${boostTier}`}`,
      value: [
        `**${boostCount}**${
          !boostTier ? "/2" : boostTier == 1 ? "/7" : boostTier == 2 ? "/14" : ""
        } boosts`,
        `**${boosters.size}** ${boosters.size == 1 ? "booster" : "boosters"}`
      ].join("\n"),
      inline: true
    }
  );

  return embed;
}
