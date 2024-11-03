import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "leveling",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    level: "INTEGER",
    xp: "INTEGER"
  }
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);

const getQuery = database.query("SELECT * FROM leveling WHERE guild = $1 AND user = $2;");
const deleteQuery = database.query("DELETE FROM leveling WHERE guild = $1 AND user = $2;");
const insertQuery = database.query(
  "INSERT INTO leveling (guild, user, level, xp) VALUES (?1, ?2, ?3, ?4);"
);

const getGuildQuery = database.query("SELECT * FROM leveling WHERE guild = $1;");

export function getLevel(guildID: string, userID: string): [number, number] {
  const res = getQuery.all(guildID, userID) as TypeOfDefinition<typeof tableDefinition>[];
  if (!res.length) return [0, 0];
  return [res[0].level, res[0].xp];
}

export function setLevel(guildID: string | number, userID: string, level: number, xp: number) {
  if (getQuery.all(guildID, userID).length) deleteQuery.run(guildID, userID);
  insertQuery.run(guildID, userID, level, xp);
}

export function getGuildLeaderboard(guildID: string): TypeOfDefinition<typeof tableDefinition>[] {
  return getGuildQuery.all(guildID) as TypeOfDefinition<typeof tableDefinition>[];
}
