import type { ColorResolvable, Guild, GuildMember, User } from "discord.js";
import Vibrant from "node-vibrant";
import sharp from "sharp";
import { genRGBColor } from "./colorGen";

/**
 * Outputs the most vibrant color from the image.
 * @param guild Guild image.
 * @param member Member image.
 * @returns The color in HEX.
 */

export async function imageColor(guild?: Guild, member?: GuildMember | User) {
  const guildURL = guild?.iconURL();
  const memberURL = member?.displayAvatarURL();
  if (!guildURL || !memberURL) return;

  const imageBuffer = await (await fetch(guild ? guildURL : memberURL)).arrayBuffer();
  const { r, g, b } = (
    await new Vibrant(await sharp(imageBuffer).toFormat("jpg").toBuffer()).getPalette()
  ).Vibrant!;

  return genRGBColor(Math.round(r), Math.round(g), Math.round(b)) as ColorResolvable;
}
