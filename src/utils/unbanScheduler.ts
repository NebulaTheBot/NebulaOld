import { Client, EmbedBuilder } from "discord.js";
import { genColor } from "./colorGen";
import { getPendingBans, removeModeration } from "./database/moderation";
import { logChannel } from "./logChannel";

export async function logUnban(client: Client) {
  const pendingBans = getPendingBans(Date.now());

  const now = Date.now();
  console.log(pendingBans);
  console.log(getPendingBans(now));
  for (const ban of pendingBans) {
    console.log(ban);
    const guild = await client.guilds.fetch(ban.guild);
    const user = guild.members.cache.get(ban.user)!;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `•  Unbanned ${user.displayName}`, iconURL: user.displayAvatarURL() })
      .setDescription([`**Moderator**: ${ban.moderator}`, "*Temporary ban has expired*"].join("\n"))
      .setFooter({ text: `User ID: ${user.id}\nCase ID: ${ban.id}` })
      .setColor(genColor(100));

    return await logChannel(guild, embed);
  }
}

export function scheduleUnban(client: Client, guildID: string, userID: string, delay: number) {
  const scheduledUnbans = new Map<string, Timer>();
  const key = `${guildID}-${userID}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key)!);

  const timeout = setTimeout(async () => {
    try {
      await logUnban(client);
      await (await client.guilds.fetch(guildID)).members.unban(userID, "Temporary ban has expired");
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
    if (delay > 0) scheduleUnban(client, ban.guild, ban.user, delay);
    else removeModeration(ban.guild, ban.id);
  }
}
