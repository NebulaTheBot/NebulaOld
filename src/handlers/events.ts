import type { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

export class Events {
  client: Client;
  events: any[] = [];
  constructor(client: Client) {
    this.client = client;
  }

  async loadEvents() {
    const eventsPath = join(process.cwd(), "src", "events");

    for (const eventFile of readdirSync(eventsPath)) {
      if (!eventFile.endsWith("ts")) continue;

      const event = (await import(pathToFileURL(join(eventsPath, eventFile)).toString())).default;
      const eventName = eventFile.split(".ts")[0];
      const clientEvent = this.client.on(eventName, event);

      this.events.push({ name: eventName, event: clientEvent });
    }
  }
}
