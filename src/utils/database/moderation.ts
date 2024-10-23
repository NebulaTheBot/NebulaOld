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
    id: "TEXT",
    timestamp: "TIMESTAMP",
    expiresAt: "TIMESTAMP"
  }
} satisfies TableDefinition;

export type modType = "MUTE" | "WARN" | "KICK" | "BAN";
const database = getDatabase(definition);
const addQuery = database.query(
  "INSERT INTO moderation (guild, user, type, moderator, reason, id, timestamp, expiresAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);"
);
const listGuildQuery = database.query("SELECT * FROM moderation WHERE guild = $1");
const listUserQuery = database.query("SELECT * FROM moderation WHERE guild = $1 AND user = $2;");
const listUserTypeQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND user = $2 AND type = $3;"
);
const listModQuery = database.query(
  "SELECT * FROM moderation WHERE guild = $1 AND moderator = $2;"
);
const getIdQuery = database.query("SELECT * FROM moderation WHERE guild = $1 AND id = $2;");
const removeQuery = database.query("DELETE FROM moderation WHERE guild = $1 AND id = $2");

export function addModeration(
  guildID: string | number,
  userID: string,
  type: modType,
  moderator: string,
  reason = "",
  expiresAt?: number | null
) {
  const id = listGuildQuery.all(guildID).length + 1;
  addQuery.run(guildID, userID, type, moderator, reason, id, Date.now(), expiresAt ?? null);
  return id;
}

export function listUserModeration(
  guildID: number | string,
  userID: number | string,
  type?: modType
) {
  if (type)
    return listUserTypeQuery.all(guildID, userID, type) as TypeOfDefinition<typeof definition>[];

  return listUserQuery.all(guildID, userID) as TypeOfDefinition<typeof definition>[];
}

export function getModeration(guildID: number | string, userID: number | string, id: string) {
  const modCase = getIdQuery.all(guildID, id) as TypeOfDefinition<typeof definition>[];
  if (modCase[0].user == userID) return modCase;
  return [];
}

export function listModeratorLog(guildID: number | string, moderator: number | string) {
  return listModQuery.all(guildID, moderator) as TypeOfDefinition<typeof definition>[];
}

export function removeModeration(guildID: string | number, id: string) {
  removeQuery.run(guildID, id);
}

const getExpiredBansQuery = database.query(
  "SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt <= $1;"
);

export function getExpiredBans(currentTime: number) {
  return getExpiredBansQuery.all(currentTime) as TypeOfDefinition<typeof definition>[];
}

const getPendingBansQuery = database.query(
  "SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt > $1;"
);

export function getPendingBans(currentTime: number) {
  return getPendingBansQuery.all(currentTime) as TypeOfDefinition<typeof definition>[];
}
