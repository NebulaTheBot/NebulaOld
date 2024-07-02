import {
  EmbedBuilder,
  type Role,
  type TextChannel,
  type Guild,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "./colorGen";
import { get, updateNews } from "./database/news";
import { getSetting } from "./database/settings";

export async function sendChannelNews(
  guild: Guild,
  id: string,
  interaction: ChatInputCommandInteraction,
  title?: string,
  body?: string,
) {
  const news = get(id)!;
  const role = getSetting(guild.id, "news", "role_id");
  let roleToSend: Role | undefined;
  if (role) roleToSend = guild.roles.cache.get(role);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${news.author}`, iconURL: news.authorPFP })
    .setTitle(title ?? news.title)
    .setDescription(body ?? news.body)
    .setTimestamp(parseInt(news.updatedAt.toString()) ?? null)
    .setFooter({ text: `Latest news from ${guild.name}\nID: ${news.id}` })
    .setColor(genColor(200));

  return (
    guild.channels.cache.get(
      getSetting(guild.id, "news", "channel_id")! ?? interaction.channel?.id
    ) as TextChannel
  )
    .send({
      embeds: [embed],
      content: roleToSend ? `<@&${roleToSend.id}>` : undefined
    })
    .then(message => updateNews(id, undefined, undefined, message.id));
}
