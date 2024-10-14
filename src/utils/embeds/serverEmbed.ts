/**
 * Sends an embed containing information about the guild.
 * @param options Options of the embed.
 * @returns Embed that contains the guild info.
 */

import { ColorResolvable, EmbedBuilder, type Guild } from "discord.js";
import { genColor, genRGBColor } from "../colorGen.js";
import Vibrant from "node-vibrant";
import sharp from "sharp";
import database, { getServerboardTable } from "../database.js";

type Options = {
  guild: Guild
  roles?: boolean
  showInvite?: boolean
  page?: number
  pages?: number
  showSubs?: boolean
  subs?: number
};

export default async function serverEmbed(options: Options) {
  const db = await database();

  const page = options.page;
  const pages = options.pages;

  // Retrieve guild information
  const guild = options.guild;
  const { premiumTier: boostTier, premiumSubscriptionCount: boostCount } = guild;
  const iconURL = guild.iconURL();

  // Getting the invite table
  const showInvite = options.showInvite;
  const serverbTable = await getServerboardTable(db);
  const invite = await serverbTable?.get(`${guild.id}.invite`).then(
    async (invite) => invite ? String(invite) : null
  ).catch(() => null);

  // Getting different types of members
  const members = guild.members.cache;
  const boosters = members.filter(member => member.premiumSince);
  const onlineMembers = members.filter(member => ["online", "dnd", "idle"].includes(member.presence?.status)).size;
  const bots = members.filter(member => member.user.bot);

  // Formatting numbers to the American comma format
  const formattedMemberCount = guild.memberCount?.toLocaleString("en-US");
  const formattedOnlineMembers = onlineMembers?.toLocaleString("en-US");
  const formattedUserCount = (guild.memberCount - bots.size)?.toLocaleString("en-US");
  const formattedBotCount = bots.size?.toLocaleString("en-US");

  // Sorting the roles
  const roles = guild.roles.cache;
  const rolesSorted = [...roles].sort((role1, role2) => role2[1].position - role1[1].position);
  rolesSorted.pop();

  // Organising the channel sizes
  const channels = guild.channels.cache;
  const channelSizes = {
    text: channels.filter(channel => channel.type === 0 || channel.type === 15 || channel.type === 5).size,
    voice: channels.filter(channel => channel.type === 2 || channel.type === 13).size,
    categories: channels.filter(channel => channel.type === 4).size
  }

  // Create the embed
  const generalValues = [
    `**Owner**: <@${guild.ownerId}>`,
    `**Created on** <t:${Math.round(guild.createdAt.valueOf() / 1000)}:D>`,
  ]
  if (options.showSubs) generalValues.push(`**Subscribers**: ${options.subs}`);
  if (showInvite && invite) generalValues.push(`**Invite link**: ${invite}`);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pages ? `#${page}  •  ` : ""}${guild.name}`,
      url: showInvite && invite ? invite : null,
      iconURL: iconURL
    })
    .setDescription(guild.description ? guild.description : null)
    .setFields({
      name: "📃 • General",
      value: generalValues.join("\n")
    })
    .setFooter({ text: `Server ID: ${guild.id}${pages ? ` • Page ${page}/${pages}` : ""}` })
    .setThumbnail(iconURL)
    .setColor(genColor(200));

  // Set the embed color
  try {
    const imageBuffer = await (await fetch(iconURL)).arrayBuffer(); // Stream the buffer
    const image = sharp(imageBuffer).toFormat("jpg");
    const { r, g, b } = (await new Vibrant(await image.toBuffer()).getPalette()).Vibrant; // Get the most vibrant color
    embed.setColor(genRGBColor(r, g, b) as ColorResolvable);
  } catch { }

  // Adding the fields
  if (options.roles) embed.addFields({
    name: `🎭 • ${roles.size - 1} ${roles.size === 1 ? "role" : "roles"}`,
    value: roles.size === 1
      ? "*None*"
      : `${rolesSorted.slice(0, 5).map(role => `<@&${role[0]}>`).join(", ")}${roles.size > 5 ? ` **and ${roles.size - 5} more**` : ""}`
  })

  embed.addFields(
    {
      name: `👥 • ${formattedMemberCount} members`,
      value: [
        `${formattedUserCount} users • ${formattedBotCount} bots`,
        `${formattedOnlineMembers} online`
      ].join("\n"),
      inline: true
    },
    {
      name: `🗨️ • ${channelSizes.text + channelSizes.voice} channels`,
      value: [
        `${channelSizes.text} text • ${channelSizes.voice} voice`,
        `${channelSizes.categories} categories`
      ].join("\n"),
      inline: true
    },
    {
      name: `🌟 • ${boostCount}${boostTier === 0 ? "/2" : boostTier === 1 ? "/7" : boostTier === 2 ? "/14" : ""} boosts`,
      value: [
        boostTier == 0 ? "No boosts" : `Level ${boostTier}`,
        `${boosters.size} ${boosters.size === 1 ? "booster" : "boosters"}`
      ].join("\n"),
      inline: true
    }
  )

  return embed;
}
