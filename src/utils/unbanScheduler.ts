import { Client, EmbedBuilder } from "discord.js";
import { genColor } from "./colorGen";
import { getPendingBans, removeModeration } from "./database/moderation";
import { logChannel } from "./logChannel";

export function scheduleUnban(
  client: Client,
  guildID: string,
  userID: string,
  modID: string,
  delay: number
) {
  const scheduledUnbans = new Map<string, Timer>();
  const key = `${guildID}-${userID}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key)!);

  const timeout = setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(guildID);
      const user = guild.bans.cache.get(userID)?.user!;
      const moderator = guild.members.cache.get(modID)!;
      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  Unbanned ${user.displayName}`, iconURL: user.displayAvatarURL() })
        .setDescription(
          [`**Moderator**: ${moderator.displayName}`, "*Temporary ban has expired*"].join("\n")
        )
        .setFooter({ text: `User ID: ${user.id}` })
        .setColor(genColor(100));

      await logChannel(guild, embed);
      await guild.members.unban(userID, "Temporary ban has expired");
      removeModeration(guildID, userID);
      scheduledUnbans.delete(key);
    } catch (error) {
      console.error(`Failed to unban user ${userID} in guild ${guildID}:`, error);
    }
  }, delay);

  return scheduledUnbans.set(key, timeout);
}

export function rescheduleUnbans(client: Client) {
  const now = Date.now();
  const pendingBans = getPendingBans(now);

  for (const ban of pendingBans) {
    if (!ban.expiresAt) continue;
    if (typeof ban.expiresAt !== "number" || isNaN(ban.expiresAt)) {
      console.error(`Invalid expiresAt value for ban: ${ban.expiresAt}`);
      continue;
    }

    const delay = ban.expiresAt - now;
    if (delay > 0) scheduleUnban(client, ban.guild, ban.user, ban.moderator, delay);
    else removeModeration(ban.guild, ban.id);
  }
}
