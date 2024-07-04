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

export const settingsDefinition: Record<string, Record<string, [FieldData, string]>> = {
  levelling: {
    enabled: ["BOOL", "Enable/disable the levelling system."],
    channel: [
      "TEXT",
      "ID of the log channel for levelling-related stuff (i.e someone levelling up)."
    ],
    block_channels: [
      "TEXT",
      "ID(s) of the channels where messages aren't counted, comma separated."
    ],
    set_level: ["TEXT", "Set the level of a user."],
    add_multiplier: [
      "TEXT",
      "Add an XP multiplier to the levelling system. Syntax: multiplier, role/channel (choose), id."
    ],
    set_xp_gain: ["INTEGER", "Set the amount of XP a user gains per message."],
    set_cooldown: ["INTEGER", "Set the cooldown between messages that add XP."]
  },
  moderation: {
    channel: [
      "TEXT",
      "ID of the log channel for moderation-related stuff (i.e a message being edited)."
    ],
    log_messages: ["BOOL", "Whether or not edited/deleted messages should be logged."]
  },
  news: {
    channel_id: ["TEXT", "ID of the channel where news messages are sent."],
    role_id: ["TEXT", "ID of the roles that should be pinged when a news message is sent."],
    edit_original_message: [
      "BOOL",
      "Whether or not the original message should be edited when a news message is updated."
    ]
  },
  serverboard: {
    invite_link: ["TEXT", "The invite link which is shown on the serverboard."],
    shown: ["BOOL", "Whether or not the server should be shown on the serverboard."]
  },
  welcome: {
    text: ["TEXT", "The welcome message that is sent when a user joins."],
    goodbye_text: ["TEXT", "The goodbye message that is sent when a user leaves."],
    channel: ["TEXT", "ID of the channel where welcome messages are sent."]
  }
};

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];
const database = getDatabase(tableDefinition);
const getQuery = database.query("SELECT * FROM settings WHERE guildID = $1 AND key = $2;");
const listPublicQuery = database.query(
  "SELECT * FROM settings WHERE key = 'serverboard.shown' AND value = '1';"
);
const deleteQuery = database.query("DELETE FROM settings WHERE guildID = $1 AND key = $2;");
const insertQuery = database.query(
  "INSERT INTO settings (guildID, key, value) VALUES (?1, ?2, ?3);"
);

export function getSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
  setting: string
): TypeOfKey<K> | null {
  let res = getQuery.all(JSON.stringify(guildID), key + "." + setting) as TypeOfDefinition<
    typeof tableDefinition
  >[];
  console.log(res);
  if (res.length == 0) return null;
  switch (settingsDefinition[key][setting][0]) {
    case "TEXT":
      return res[0].value as TypeOfKey<K>;
    case "BOOL":
      return (
        res[0].value != null && res[0].value != "" && res[0].value != "false" ? "true" : "false"
      ) as TypeOfKey<K>;
    case "INTEGER":
      return parseInt(res[0].value) as TypeOfKey<K>;
    default:
      return "WIP" as TypeOfKey<K>;
  }
}

export function setSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
  setting: string,
  value: string //TypeOfKey<K>
) {
  const doInsert = getSetting(guildID, key, setting) == null;
  if (!doInsert) {
    deleteQuery.all(JSON.stringify(guildID), key + "." + setting);
  }
  insertQuery.run(JSON.stringify(guildID), key + "." + setting, value);
}

export function listPublicServers() {
  return (listPublicQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(entry =>
    JSON.parse(entry.guildID)
  );
}

// Utility type
type TypeOfKey<T extends keyof typeof settingsDefinition> = SqlType<
  (typeof settingsDefinition)[T][any][0]
>;
