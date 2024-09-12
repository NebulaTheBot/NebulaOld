import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const definition = {
  name: "moderation",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    type: "TEXT",
    moderator: "TEXT",
    reason: "TEXT",
    public: "BOOL",
    id: "TEXT",
    timestamp: "TIMESTAMP"
  }
} satisfies TableDefinition;

type modType = "MUTE" | "WARN" | "KICK" | "BAN";
const database = getDatabase(definition);
const addQuery = database.query(
  "INSERT INTO moderation (guild, user, type, moderator, reason, public, id, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);"
);
const listUserQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND user = $2;"
);
const listUserTypeQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND user = $2 AND type = $3;"
);
const listModQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND moderator = $2;"
);
const getIdQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND id = $2;"
);
const removeQuery = database.query("DELETE FROM moderation WHERE guild = $1 AND id = $2");

export function addModeration(
  guildID: string | number,
  userID: string,
  type: modType,
  moderator: string,
  reason = "",
  pub = false
) {
  const id = crypto.randomUUID();
  addQuery.run(guildID, userID, type, moderator, reason, pub, id, Date.now());
  return id;
}

export function listUserModeration(
  guildID: number | string,
  userID: number | string,
  type?: modType
) {
  if (type) return listUserTypeQuery.all(guildID, userID, type) as TypeOfDefinition<typeof definition>[];
  return listUserQuery.all(guildID, userID) as TypeOfDefinition<typeof definition>[];
}

export function getModeration(guildID: number | string, userID: number | string, id: string) {
  var thecase = getIdQuery.all(guildID, id) as TypeOfDefinition<typeof definition>[];
  if (thecase[0].user == userID) return thecase;
  return [];
}

export function listModeratorLog(guildID: number | string, moderator: number | string) {
  return listModQuery.all(guildID, moderator) as TypeOfDefinition<typeof definition>[];
}

export function removeModeration(guildID: string | number, id: string) {
  removeQuery.run(guildID, id);
}
