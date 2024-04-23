import { getDatabase } from ".";
import { FieldData, SqlType, TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "settings",
  definition: {
    guildID: "TEXT",
    key: "TEXT",
    value: "TEXT"
  }
} satisfies TableDefinition;

export const settingsDefinition = {
  "levelling.enabled": ["BOOL", "Enable/disable the levelling system."],
  "levelling.channel": ["TEXT", "ID of the log channel for levelling-related stuff (i.e someone levelling up)."],
  "levelling.blockChannels": ["TEXT", "ID(s) of the channels where messages aren't counted, comma separated."],
  "levelling.setLevel": ["TEXT", "Set the level of a user."],
  "levelling.addMultiplier": ["TEXT", "Add an XP multiplier to the levelling system. Syntax: multiplier, role/channel (choose), id."],
  "levelling.setXPGain": ["INTEGER", "Set the amount of XP a user gains per message."],
  "levelling.setCooldown": ["INTEGER", "Set the cooldown between messages that add XP."],
  "moderation.channel": ["TEXT", "ID of the log channel for moderation-related stuff (i.e a message being edited)."],
  "moderation.logMessages": ["BOOL", "Whether or not edited/deleted messages should be logged."],
  "news.channelID": ["TEXT", "ID of the channel where news messages are sent."],
  "news.roleID": ["TEXT", "ID of the roles that should be pinged when a news message is sent."],
  "news.editOriginalMessage": ["BOOL", "Whether or not the original message should be edited when a news message is updated."],
  "serverboard.inviteLink": ["TEXT", "The invite link which is shown on the serverboard."],
  "serverboard.shown": ["BOOL", "Whether or not the server should be shown on the serverboard."],
  "welcome.text": ["TEXT", "The welcome message that is sent when a user joins."],
  "welcome.goodbyeText": ["TEXT", "The goodbye message that is sent when a user leaves."],
  "welcome.channel": ["TEXT", "ID of the channel where welcome messages are sent."],
} satisfies Record<string, [FieldData, String]>;

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];
const database = getDatabase(tableDefinition);
const getQuery = database.query("SELECT * FROM settings WHERE guildID = $1 AND key = $2;");
const listPublicQuery = database.query(
  "SELECT * FROM settings WHERE key = 'serverboard.shown' AND value = 'TRUE';"
);
const deleteQuery = database.query("DELETE FROM settings WHERE guildID = $1 AND key = $2;");
const insertQuery = database.query(
  "INSERT INTO settings (guildID, key, value) VALUES (?1, ?2, ?3);"
);

export function getSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K
): TypeOfKey<K> | null {
  let res = getQuery.all(JSON.stringify(guildID), key) as TypeOfDefinition<
    typeof tableDefinition
  >[];
  if (res.length == 0) return null;
  switch (settingsDefinition[key][0]) {
    case "TEXT" || "INTEGER":
      return res[0].value as TypeOfKey<K>;
    case "BOOL":
      return (res[0].value == "true") as TypeOfKey<K>;
    default:
      return "WIP" as TypeOfKey<K>;
  }
}

export function setSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
  value: TypeOfKey<K>
) {
  const doInsert = getSetting(guildID, key) == null;
  if (!doInsert) {
    deleteQuery.all(JSON.stringify(guildID), key);
  }
  insertQuery.run(JSON.stringify(guildID), key, JSON.stringify(value));
}

export function listPublicServers() {
  return (listPublicQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(entry =>
    JSON.parse(entry.guildID)
  );
}

// Utility type
type TypeOfKey<T extends keyof typeof settingsDefinition> = SqlType<(typeof settingsDefinition)[T][0]>;
