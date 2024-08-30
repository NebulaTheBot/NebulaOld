import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const definition = {
  name: "news",
  definition: {
    guildID: "TEXT",
    title: "TEXT",
    body: "TEXT",
    author: "TEXT",
    authorPFP: "TEXT",
    createdAt: "TIMESTAMP",
    updatedAt: "TIMESTAMP",
    messageID: "TEXT",
    id: "TEXT"
  }
} satisfies TableDefinition;

const database = getDatabase(definition);
const sendQuery = database.query(
  "INSERT INTO news (guildID, title, body, author, authorPFP, createdAt, updatedAt, messageID, id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);"
);
const listAllQuery = database.query("SELECT * FROM news WHERE guildID = $1;");
const getIdQuery = database.query("SELECT * FROM news WHERE id = $1;");
const deleteQuery = database.query("DELETE FROM news WHERE id = $1");

export function addNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  id: string
) {
  sendQuery.run(guildID, title, body, author, authorPFP, Date.now(), 0, messageID, id);
}

export function listAllNews(guildID: string) {
  return listAllQuery.all(guildID) as TypeOfDefinition<typeof definition>[];
}

export function get(id: string) {
  return getIdQuery.get(id) as TypeOfDefinition<typeof definition> | null;
}

export function updateNews(id: string, title?: string, body?: string, messageID?: string) {
  const lastElem = get(id)!;
  deleteQuery.run(id);
  sendQuery.run(
    lastElem.guildID,
    title ?? lastElem.title,
    body ?? lastElem.body,
    lastElem.author,
    lastElem.authorPFP,
    Date.now(),
    0,
    messageID ?? lastElem.messageID,
    id
  );
}

export function deleteNews(id: string) {
  deleteQuery.run(id);
}
