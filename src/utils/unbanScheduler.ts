import { Client } from "discord.js";
import { removeModeration, getPendingBans } from "./database/moderation";

export function scheduleUnban(client: Client, guildId: string, userId: string, delay: number) {
  const scheduledUnbans = new Map<string, Timer>();
  const key = `${guildId}-${userId}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key)!);

  // 24.8 days because why not
  const maxDelay = 2147483647;

  if (delay > maxDelay) {
    const remainingDelay = delay - maxDelay;
    const timeout = setTimeout(() => {
      scheduleUnban(client, guildId, userId, remainingDelay);
    }, maxDelay);

    scheduledUnbans.set(key, timeout);
  } else {
    const timeout = setTimeout(async () => {
      try {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.unban(userId, "Temporary ban expired");
        removeModeration(guildId, userId);
        scheduledUnbans.delete(key);
      } catch (error) {
        console.error(`Failed to unban user ${userId} in guild ${guildId}:`, error);
      }
    }, delay);

    scheduledUnbans.set(key, timeout);
  }
}

export function rescheduleUnbans(client: Client) {
  const now = Date.now();
  const pendingBans = getPendingBans(now);

  for (const ban of pendingBans) {
    if (!ban.expiresAt || ban.expiresAt == 0) continue;

    if (typeof ban.expiresAt !== "number" || isNaN(ban.expiresAt)) {
      console.error(`Invalid expiresAt value for ban: ${ban.expiresAt}`);
      continue;
    }

    const delay = ban.expiresAt - now;
    if (delay > 0) scheduleUnban(client, ban.guild, ban.user, delay);
    else removeModeration(ban.guild, ban.id);
  }
}
