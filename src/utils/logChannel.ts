import {
  ChannelType,
  type Channel,
  type EmbedBuilder,
  type Guild,
  type TextChannel
} from "discord.js";
import { getSetting } from "./database/settings";

export async function logChannel(guild: Guild, embed: EmbedBuilder) {
  const logChannel = getSetting(guild.id, "moderation", "channel");
  if (logChannel) {
    const channel = await guild.channels.cache
      .get(`${logChannel}`)
      ?.fetch()
      .then((channel: Channel) => {
        if (channel.type != ChannelType.GuildText) return null;
        return channel as TextChannel;
      })
      .catch(() => null);

    if (channel) await channel.send({ embeds: [embed] });
  }
}
