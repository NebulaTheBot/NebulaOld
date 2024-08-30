import {
  ChannelType,
  type Channel,
  type EmbedBuilder,
  type Guild,
  type TextChannel
} from "discord.js";
import { getSetting } from "./database/settings";

/**
 * Sends a message in the log channel. (if there is one set)
 * @param guild The guild where the log channel is located.
 * @param embed Embed of the log.
 * @returns Log message.
 */
export async function logChannel(guild: Guild, embed: EmbedBuilder) {
  const logChannel = getSetting(guild.id, "moderation", "channel");
  if (!logChannel) return;

  const channel = await guild.channels.cache
    .get(`${logChannel}`)
    ?.fetch()
    .then((channel: Channel) => {
      if (
        channel.type != ChannelType.GuildText &&
        ChannelType.PublicThread &&
        ChannelType.PrivateThread &&
        ChannelType.GuildVoice
      )
        return null;

      return channel as TextChannel;
    })
    .catch(() => null);

  if (channel) return await channel.send({ embeds: [embed] });
}
