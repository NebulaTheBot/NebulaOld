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
  "levelling.enabled": "BOOL",
  "levelling.channel": "TEXT",
  "levelling.blockChannels": "TEXT",
  "levelling.setLevel": "INTEGER",
  "levelling.addMultiplier": "JSON",
  "moderation.channel": "TEXT",
  "moderation.logMessages": "BOOL",
  "news.channelID": "TEXT",
  "news.roleID": "TEXT",
  "news.editOriginalMessage": "BOOL",
  "serverboard.inviteLink": "TEXT",
  "serverboard.shown": "BOOL",
  "welcome.text": "TEXT",
  "welcome.goodbyeText": "TEXT",
  "welcome.channel": "TEXT"
} satisfies Record<string, FieldData>;

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
  switch (settingsDefinition[key]) {
    case "TEXT" || "INTEGER":
      return res[0].value as TypeOfKey<K>;
    case "BOOL":
      return (res[0].value == "true") as TypeOfKey<K>;
    case "JSON":
      return res[0].value.split("," && ", ") as TypeOfKey<K>;
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
  insertQuery.run(JSON.stringify(guildID), key, value);
}

export function listPublicServers() {
  return (listPublicQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(entry =>
    JSON.parse(entry.guildID)
  );
}

// Utility type
type TypeOfKey<T extends keyof typeof settingsDefinition> = SqlType<(typeof settingsDefinition)[T]>;
