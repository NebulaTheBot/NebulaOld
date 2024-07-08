import { ShardingManager } from "discord.js";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });
manager.on("shardCreate", shard => {
  shard.on("error", err => console.error(err));
  console.log(`Launched shard ${shard.id}`);
});

manager.spawn();
