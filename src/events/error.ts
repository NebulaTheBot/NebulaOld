import { DiscordErrorData, type Client } from "discord.js";

export default {
  name: "error",
  event: class Error {
    client: Client;
    constructor(client: Client) {
      this.client = client;
    }

    async run(error: DiscordErrorData) {
      console.error(error);
    }
  }
};
