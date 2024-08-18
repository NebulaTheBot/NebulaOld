import { ActivityType, Client } from "discord.js";
import { Commands } from "./handlers/commands";
import { Events } from "./handlers/events";

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
  new Events(client);
  await new Commands(client).registerCommands();
  console.log("ちーっす！");
});

client.login(process.env.TOKEN);
