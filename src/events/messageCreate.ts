import { EmbedBuilder, type TextChannel, type Message } from "discord.js";
import { pathToFileURL } from "url";
import { join } from "path";
import { readdirSync } from "fs";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { getLevel, setLevel } from "../utils/database/levelling";
import { get as getLevelRewards } from "../utils/database/levelRewards";

export default {
  name: "messageCreate",
  event: class MessageCreate {
    async run(message: Message) {
      const author = message.author;
      if (author.bot) return;
      const guild = message.guild!;

      // Easter egg handler
      if (guild.id === "903852579837059113") {
        const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

        for (const easterEggFile of readdirSync(eventsPath))
          new (
            await import(pathToFileURL(join(eventsPath, easterEggFile)).toString())
          ).default().run(message, ...message.content);
      }

      // Levelling
      if (!getSetting(guild.id, "levelling.enabled")) return;

      const blockedChannels = getSetting(guild.id, "levelling.blockChannels")!;
      if (blockedChannels != undefined)
        for (const channelID of blockedChannels.split(", "))
          if (message.channelId === channelID) return;

      const levelChannelId = getSetting(guild.id, "levelling.channel");
      const [guildExp, guildLevel] = getLevel(guild.id, author.id);
      const [globalExp, globalLevel] = getLevel("0", author.id);
      const expPerMessage = 2;
      const expUntilLevelup = Math.floor(100 * 1.25 * (guildLevel + 1));
      const newLevelData = { level: guildLevel ?? 0, exp: (guildExp ?? 0) + expPerMessage };
      const globalNewLevelData = { level: globalLevel ?? 0, exp: (globalExp ?? 0) + expPerMessage };

      if (guildExp < expUntilLevelup - 1) {
        setLevel(0, author.id, globalNewLevelData.exp, globalNewLevelData.level);
        return setLevel(guild.id, author.id, globalNewLevelData.exp, globalNewLevelData.level);
      } else if (guildExp >= expUntilLevelup - 1) {
        let leftOverExp = guildExp - expUntilLevelup;
        if (leftOverExp < 0) leftOverExp = 0;

        newLevelData.exp = leftOverExp ?? 0;
        newLevelData.level = guildLevel + 1;
        setLevel(guild.id, author.id, newLevelData.exp, newLevelData.level);
      }

      if (guildExp >= Math.floor(100 * 1.25 * (globalLevel + 1)) - 1) {
        let globalLeftOverExp = guildExp - expUntilLevelup;
        if (globalLeftOverExp < 0) globalLeftOverExp = 0;
        setLevel(0, author.id, guildLevel + 1, globalLeftOverExp + 1);
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: `•  ${author.displayName}`, iconURL: author.avatarURL() || undefined })
        .setTitle("Level up!")
        .setDescription(
          [
            `**Congratulations, ${author.displayName}**!`,
            `You made it to **level ${guildLevel + 1}**`,
            `You need ${Math.floor(100 * 1.25 * (guildLevel + 2))} EXP to level up again.`
          ].join("\n")
        )
        .setThumbnail(author.avatarURL())
        .setTimestamp()
        .setColor(genColor(200));

      if (levelChannelId)
        (guild.channels.cache.get(`${levelChannelId}`) as TextChannel).send({
          embeds: [embed],
          content: `<@${author.id}>`
        });

      for (const { level, roleID } of getLevelRewards(guild.id)) {
        const role = guild.roles.cache.get(`${roleID}`);
        if (!role) continue;

        const authorRoles = (await guild.members.fetch()).get(author.id)?.roles;
        if (guildLevel >= level) {
          await authorRoles?.add(role);
          continue;
        }

        await authorRoles?.remove(role);
      }
    }
  }
};
