import { getDatabase } from ".";
import { kominator } from "../kominator";
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
  {
    description: string;
    settings: Record<string, { type: FieldData; desc: string; val?: any }>;
  }
> = {
  levelling: {
    description: "Customise the behaviour of the leveling system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the levelling system.",
        val: true
      },
      channel: {
        type: "TEXT",
        desc: "ID of the log channel for levelling-related stuff (i.e someone levelling up)."
      },
      block_channels: {
        type: "TEXT",
        desc: "ID(s) of the channels where messages aren't counted, comma separated."
      },
      // set_level: { type: "TEXT", desc: "Set the level of a user." },
      // add_multiplier: {
      //   type: "LIST",
      //   desc: "Add an XP multiplier to the levelling system.",
      //   val: {
      //     multiplier: { type: "INTEGER", desc: "Set the XP multiplier for the role/channel." },
      //     role_channel: { type: "TEXT", desc: "Role or channel. (choose)" },
      //     id: { type: "TEXT", desc: "ID of the role/channel." }
      //   }
      // },
      xp_gain: {
        type: "INTEGER",
        desc: "Set the amount of XP a user gains per message.",
        val: 5
      },
      cooldown: {
        type: "INTEGER",
        desc: "Set the cooldown between messages that add XP.",
        val: 2
      },
      difficulty: {
        type: "INTEGER",
        desc: "Set the difficulty (ex: 2 will make it 2x harder to level up).",
        val: 1
      }
    }
  },
  moderation: {
    description: "Tweak Sokora's moderation-related logs.",
    settings: {
      channel: {
        type: "TEXT",
        desc: "ID of the log channel for moderation-related stuff (i.e a message being edited)."
      },
      log_messages: {
        type: "BOOL",
        desc: "Whether or not edited/deleted messages should be logged.",
        val: true
      }
    }
  },
  news: {
    description: "Configure news for this server.",
    settings: {
      channel_id: {
        type: "TEXT",
        desc: "ID of the channel where news messages are sent."
      },
      role_id: {
        type: "TEXT",
        desc: "ID of the roles that should be pinged when a news message is sent."
      },
      edit_original_message: {
        type: "BOOL",
        desc: "Whether or not the original message should be edited when a news message is updated.",
        val: true
      }
    }
  },
  serverboard: {
    description: "Configure your server's appearance on the serverboard.",
    settings: {
      shown: {
        type: "BOOL",
        desc: "Whether or not the server should be shown on the serverboard.",
        val: false
      }
    }
  },
  welcome: {
    description: "Tweak how Sokora welcomes your new users",
    settings: {
      join_text: {
        type: "TEXT",
        desc: "Text sent when a user joins. (name) - username, (count) - member count, (servername) - server name.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!"
      },
      leave_text: {
        type: "TEXT",
        desc: "Text sent when a user leaves. (name) - username, (count) - member count, (servername) - server name.",
        val: "(name) has left the server! 😥"
      },
      channel: { type: "TEXT", desc: "ID of the channel where welcome messages are sent." },
      join_dm: {
        type: "BOOL",
        desc: "Whether or not the bot should send a custom DM message to the user upon joining.",
        val: false
      },
      dm_text: {
        type: "TEXT",
        desc: "Text sent in the user's DM when they join the server. Same syntax as join_text.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!"
      }
    }
  },
  easter: {
    description: "Enable or disable easter eggs",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Whether or not the bot should reply to certain messages with 'easter egg' messages.",
        val: true
      }
    }
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

export function getSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"]
>(
  guildID: string,
  key: K,
  setting: S
): SqlType<(typeof settingsDefinition)[K]["settings"][S]["type"]> | null {
  let res = getQuery.all(JSON.stringify(guildID), key + "." + setting) as TypeOfDefinition<
    typeof tableDefinition
  >[];
  const set = settingsDefinition[key].settings[setting];

  if (!res.length) {
    if (set.type == "LIST") return null;
    return set.val;
  }

  switch (set.type) {
    case "TEXT":
      return res[0].value as SqlType<typeof set.type>;
    case "BOOL":
      return (res[0].value === "1" ? true : false) as SqlType<typeof set.type>;
    case "INTEGER":
      return parseInt(res[0].value) as SqlType<typeof set.type>;
    case "LIST":
      return kominator(res[0].value) as SqlType<typeof set.type>;
    default:
      return "WIP"; // as TypeOfKey<K>;
  }
}

export function setSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
  setting: string,
  value: string // TypeOfKey<K>
) {
  const doInsert = getSetting(guildID, key, setting) == null;
  if (!doInsert) deleteQuery.all(JSON.stringify(guildID), key + "." + setting);
  insertQuery.run(JSON.stringify(guildID), `${key}.${setting}`, value);
}

export function listPublicServers() {
  return (listPublicQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(entry =>
    JSON.parse(entry.guildID)
  );
}

// Utility type
type TypeOfKey<K extends keyof typeof settingsDefinition, S extends string> = SqlType<
  (typeof settingsDefinition)[K]["settings"][S]["type"]
>;
