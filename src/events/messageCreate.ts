import { EmbedBuilder, type TextChannel } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { genColor } from "../utils/colorGen";
import { getLevel, setLevel } from "../utils/database/levelling";
import { getSetting } from "../utils/database/settings";
import { kominator } from "../utils/kominator";
import { Event } from "../utils/types";

const cooldowns = new Map<string, number>();
export default (async function run(message) {
  const author = message.author;
  if (author.bot) return;
  const guild = message.guild!;

  // Easter egg handler
  // i kept the old ID used here (if guild.id == "ID") in my .env file, just in case
  if (getSetting(guild.id, "easter", "enabled") == true) {
    const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

    for (const easterEggFile of readdirSync(eventsPath))
      (await import(pathToFileURL(join(eventsPath, easterEggFile)).toString())).default(message);
  }

  // Levelling
  if (!getSetting(guild.id, "levelling", "enabled")) return;

  const blockedChannels = getSetting(guild.id, "levelling", "block_channels") as string;
  if (blockedChannels != undefined)
    for (const channelID of kominator(blockedChannels)) if (message.channelId == channelID) return;

  const cooldown = getSetting(guild.id, "levelling", "cooldown") as number;
  if (cooldown > 0) {
    const key = `${guild.id}-${author.id}`;
    const lastExpTime = cooldowns.get(key) || 0;
    const now = Date.now();

    if (now - lastExpTime < cooldown * 1000) return;
    else cooldowns.set(key, now);
  }

  const xpGain = getSetting(guild.id, "levelling", "xp_gain") as number;
  const levelChannelId = getSetting(guild.id, "levelling", "channel");
  const difficulty = getSetting(guild.id, "levelling", "difficulty") as number;
  const [level, xp] = getLevel(guild.id, author.id);
  const xpUntilLevelUp = Math.floor(
    100 * difficulty * (level + 1) ** 2 - 85 * difficulty * level ** 2
  );
  const newLevelData = { level: level ?? 0, xp: xp + xpGain };

  if (newLevelData.xp < xpUntilLevelUp)
    return setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);

  while (
    newLevelData.xp >=
    100 * difficulty * (newLevelData.level + 1) ** 2 - 85 * difficulty * newLevelData.level ** 2
  )
    newLevelData.level++;

  setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);
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
} as Event<"messageCreate">);
