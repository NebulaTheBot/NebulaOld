import type { ChannelType } from "discord.js";

export type TextChannels =
  | ChannelType.GuildText
  | ChannelType.GuildPublicThread
  | ChannelType.GuildPrivateThread
  | ChannelType.GuildVoice;
