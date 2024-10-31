import { EmbedBuilder, type TextChannel } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { genColor } from "../utils/colorGen";
import { getLevel, setLevel } from "../utils/database/levelling";
import { getSetting } from "../utils/database/settings";
import { kominator } from "../utils/kominator";
import { Event } from "../utils/types";

export default (async function run(message) {
  const author = message.author;
  if (author.bot) return;
  const guild = message.guild!;

  // Easter egg handler
  if (guild.id == "1079612082636472420") {
    const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

    for (const easterEggFile of readdirSync(eventsPath))
      (await import(pathToFileURL(join(eventsPath, easterEggFile)).toString())).default(message);
  }

  // Levelling
  if (!getSetting(guild.id, "levelling", "enabled")) return;

  // const level = getSetting(guild.id, "levelling", "set_level") as string;
  // if (level) {
  //   const newLevel = kominator(level);
  //   setLevel(guild.id, newLevel[0], +newLevel[1], 100 * +newLevel[1]);
  //   setSetting(guild.id, "levelling", "set_level", "");
  // }

  const blockedChannels = getSetting(guild.id, "levelling", "block_channels") as string;
  if (blockedChannels != undefined)
    for (const channelID of kominator(blockedChannels)) if (message.channelId == channelID) return;

  const cooldowns = new Map<string, number>();
  const cooldown = getSetting(guild.id, "levelling", "cooldown") as number;
  // const multiplier = getSetting(guild.id, "levelling", "add_multiplier");

  if (cooldown > 0) {
    const key = `${guild.id}-${author.id}`;
    const lastExpTime = cooldowns.get(key) || 0;
    const now = Date.now();

    if (now - lastExpTime < cooldown * 1000) return;
    else cooldowns.set(key, now);
  }
  console.log(cooldowns);

  // if (multiplier) {
  //   const expMultiplier = kominator(multiplier as string);
  //
  //   if (expMultiplier[1] == "channel") if (message.channelId != expMultiplier[2]) return;
  //   if (expMultiplier[1] == "role")
  //     if (!message.member?.roles.cache.has(expMultiplier[2])) return;
  //
  //   expGain = expGain * +expMultiplier[0];
  // }

  const xpGain = getSetting(guild.id, "levelling", "xp_gain") as number;
  const levelChannelId = getSetting(guild.id, "levelling", "channel");
  const difficulty = getSetting(guild.id, "levelling", "difficulty") as number;
  const [level, xp] = getLevel(guild.id, author.id);
  const xpUntilLevelup = 100 * difficulty * (level + 1) + 100 * difficulty * level;
  const newLevelData = { level: level ?? 0, xp: xp + xpGain };

  console.log(xp, newLevelData.xp);
  if (newLevelData.xp < xpUntilLevelup)
    return setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);

  if (newLevelData.xp >= xpUntilLevelup) {
    newLevelData.level = level + 1;
    setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName} has levelled up!`,
      iconURL: author.displayAvatarURL()
    })
    .setDescription(
      [
        `**Congratulations, ${author.displayName}**!`,
        `You made it to **level ${level + 1}**`,
        `You need ${Math.floor(100 * difficulty * (level + 2))} XP to level up again.`
      ].join("\n")
    )
    .setThumbnail(author.displayAvatarURL())
    .setTimestamp()
    .setColor(genColor(200));

  if (levelChannelId)
    (guild.channels.cache.get(`${levelChannelId}`) as TextChannel).send({
      embeds: [embed],
      content: `<@${author.id}>`
    });

  // for (const { level, roleID } of getLevelRewards(guild.id)) {
  //   const role = guild.roles.cache.get(`${roleID}`);
  //   if (!role) continue;
  //
  //   const authorRoles = (await guild.members.fetch()).get(author.id)?.roles;
  //   if (guildLevel >= level) {
  //     await authorRoles?.add(role);
  //     continue;
  //   }
  //
  //   await authorRoles?.remove(role);
  // }
} as Event<"messageCreate">);
