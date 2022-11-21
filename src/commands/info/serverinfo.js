const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { getColor } = require("../../utils/misc");

module.exports = class Serverinfo {
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("serverinfo")
      .setDescription("Shows this server's info.");
  }

  async run(interaction) {
    const guild = interaction.member.guild;
    const level = guild.verificationLevel;
    const boostTier = guild.premiumTier;
    const everyone = guild.roles.everyone;

    const allMembers = await guild.members.fetch();
    const allChannels = await guild.channels.fetch();
    const allRoles = await guild.roles.fetch();

    const viewChannel = PermissionsBitField.Flags.ViewChannel;
    const textChannels = allChannels.filter(c => c.type === 0, 15).size;
    const voiceChannels = allChannels.filter(c => c.type === 2).size;
    const hiddenTextChannels = allChannels.filter(c => !c.permissionsFor(everyone).has(viewChannel) && c.type === 0, 15).size;
    const hiddenVoiceChannels = allChannels.filter(c => !c.permissionsFor(everyone).has(viewChannel) && c.type === 2).size;

    const roles = allRoles.filter(r => r !== everyone && !r.managed && !r.name.toLowerCase().includes("bot"));
    const botRoles = allRoles.filter(r => r !== everyone && r.managed || !r.managed && r.name.toLowerCase().includes("bot"));
    const test = roles.map(r => r.rawPosition.sort(function(a, b) { return a - b }));
    console.log(test);

    const embed = new EmbedBuilder()
      .setTitle(`Showing info for ${guild.name}`)
      .addFields(
        {
          name: "📃 | General",
          value: [
            `**Owner**: <@${guild.ownerId}>`,
            `**Created at**: <t:${parseInt(guild.createdTimestamp / 1000)}:d>`,
            `**Security level**: ${level === 0 ? "None" : level === 1 ? "Low" : level === 2 ? "Medium" : level === 3 ? "High" : "Highest"}`,
            `**Community**: ${guild.features.includes("COMMUNITY") ? "Enabled" : "Disabled"}`,
            guild.features.includes("COMMUNITY") ? `**Description**: ${guild.description == null ? "None" : guild.description}` : null
          ].join("\n")
        },
        {
          name: `👥 | Members: ${guild.memberCount}`,
          value: [
            `**Users**: ${allMembers.filter(m => !m.user.bot).size}`,
            `**Bots**: ${allMembers.filter(m => m.user.bot).size}`
          ].join("\n"),
          inline: true
        },
        {
          name: `📜 | Channels: ${textChannels + voiceChannels}`,
          value: [
            `**Text**: ${textChannels} (hidden: ${hiddenTextChannels})`,
            `**Voice**: ${voiceChannels} (hidden: ${hiddenVoiceChannels})`
          ].join("\n"),
          inline: true
        },
        {
          name: `🌟 | Boosts: ${guild.premiumSubscriptionCount}${boostTier === 0 ? "/2" : boostTier === 1 ? "/7" : boostTier === 2 ? "/14" : null}`,
          value: `**Level**: ${boostTier +1}\n**Boosters**: ${allMembers.filter(m => m.premiumSince).size}`,
          inline: true
        },
        {
          name: `Roles: ${roles.size + botRoles.size}`,
          value: [
            `**User roles**: ${roles.map(r => `${r}`).join(", ")} and **insert number here** more`,
            `**Bot roles**: ${botRoles.map(r => `${r}`).join(", ")} and **insert number here** more`
          ].join("\n")
        }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor(getColor(200));

    interaction.reply({ embeds: [embed] });
  }
}