import {
  EmbedBuilder,
  TextChannel,
  ChannelType,
  type Channel,
  type ChatInputCommandInteraction,
  type User
} from "discord.js";
import { getSetting } from "../database/settings";
import { genColor } from "../colorGen";
import ms from "ms";

type Options = {
  interaction: ChatInputCommandInteraction;
  user: User;
  action: string;
  duration?: string | null;
  reason?: string | null;
};

export async function modEmbed(options: Options) {
  const { interaction, user, action, duration, reason } = options;
  const guild = interaction.guild!;
  const name = user.displayName;
  const generalValues = [`**Moderator**: ${interaction.user.displayName}`];
  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  if (reason) generalValues.push(`**Reason**: ${reason}`);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${name}`, iconURL: user.displayAvatarURL() })
    .setTitle(`${action} ${name}.`)
    .setDescription(generalValues.join("\n"))
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(100));

  const logChannel = getSetting(guild.id, "moderation.channel");
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

  await interaction.reply({ embeds: [embed] });
  if (user.bot) return;
  (await user.createDM())
    .send({
      embeds: [embed.setTitle(`You got ${action.toLowerCase()}.`).setColor(genColor(0))]
    })
    .catch(() => null);
}
