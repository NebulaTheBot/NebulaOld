import { ActivityType, Client } from "discord.js";
import { Commands } from "./handlers/commands";
import { Events } from "./handlers/events";
import { rescheduleUnbans } from "./utils/unbanScheduler";

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

client.on("ready", async () => {
  await new Events(client).loadEvents();
  await new Commands(client).registerCommands();
  console.log("ちーっす！");
  rescheduleUnbans(client);
});

client.login(process.env.TOKEN);
