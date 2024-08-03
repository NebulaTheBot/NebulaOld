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

export const settingsDefinition: Record<
  string,
  Record<string, { type: FieldData; desc: string; val?: any }>
> = {
  levelling: {
    enabled: { type: "BOOL", desc: "Enable/disable the levelling system.", val: true },
    channel: {
      type: "TEXT",
      desc: "ID of the log channel for levelling-related stuff (i.e someone levelling up)."
    },
    block_channels: {
      type: "TEXT",
      desc: "ID(s) of the channels where messages aren't counted, comma separated."
    },
    set_level: { type: "TEXT", desc: "Set the level of a user." },
    add_multiplier: {
      type: "TEXT",
      desc: "Add an XP multiplier to the levelling system. Syntax: multiplier, role/channel (choose), id."
    },
    set_xp_gain: {
      type: "INTEGER",
      desc: "Set the amount of XP a user gains per message.",
      val: 2
    },
    set_cooldown: {
      type: "INTEGER",
      desc: "Set the cooldown between messages that add XP.",
      val: 2
    }
  },
  moderation: {
    channel: {
      type: "TEXT",
      desc: "ID of the log channel for moderation-related stuff (i.e a message being edited)."
    },
    log_messages: {
      type: "BOOL",
      desc: "Whether or not edited/deleted messages should be logged.",
      val: true
    }
  },
  news: {
    channel_id: { type: "TEXT", desc: "ID of the channel where news messages are sent." },
    role_id: {
      type: "TEXT",
      desc: "ID of the roles that should be pinged when a news message is sent."
    },
    edit_original_message: {
      type: "BOOL",
      desc: "Whether or not the original message should be edited when a news message is updated.",
      val: true
    }
  },
  serverboard: {
    invite_link: {
      type: "TEXT",
      desc: "The invite link which is shown on the serverboard."
    },
    shown: {
      type: "BOOL",
      desc: "Whether or not the server should be shown on the serverboard.",
      val: false
    }
  },
  welcome: {
    text: { type: "TEXT", desc: "The welcome message that is sent when a user joins." },
    goodbye_text: {
      type: "TEXT",
      desc: "The goodbye message that is sent when a user leaves."
    },
    channel: { type: "TEXT", desc: "ID of the channel where welcome messages are sent." }
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
  if (res.length == 0) return null;
  switch (settingsDefinition[key][setting].type) {
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
  value: string // TypeOfKey<K>
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
  (typeof settingsDefinition)[T][any]["type"]
>;
