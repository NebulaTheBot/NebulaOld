import { ActivityType, Client } from "discord.js";
import { Commands } from "./handlers/commands";
import { Events } from "./handlers/events";
import { getExpiredBans, removeModeration } from "./utils/database/moderation";

const client = new Client({
  presence: {
    activities: [{ name: "your feedback!", type: ActivityType.Listening }]
  },
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildEmojisAndStickers",
    "GuildPresences",
    "GuildBans",
    "MessageContent"
  ]
});

const checkInterval = 60 * 500;

client.on("ready", async () => {
  await new Events(client).loadEvents();
  await new Commands(client).registerCommands();
  console.log("ちーっす！");
  setInterval(async () => {
    const now = Date.now();
    const expiredBans = getExpiredBans(now);

    for (const ban of expiredBans) {
      try {
        const guild = await client.guilds.fetch(ban.guild).catch(() => null);
        if (!guild) {
          removeModeration(ban.guild, ban.id);
          continue;
        }

        const userId = ban.user.toString();

        const banInfo = await guild.bans.fetch(userId).catch(() => null);
        if (!banInfo) {
          removeModeration(ban.guild, ban.id);
          continue;
        }

        await guild.members.unban(userId, "Temporary ban expired");

        removeModeration(ban.guild, ban.id);

      } catch (error) {
        console.error(`Failed to unban user ID ${ban.user} in guild ${ban.guild}:`, error);
      }
    }
  }, checkInterval);
});

client.login(process.env.TOKEN);
