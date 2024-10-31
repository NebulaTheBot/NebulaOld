import { ClientEvents } from "discord.js";

export type Event<T extends keyof ClientEvents> = (...args: ClientEvents[T][0][]) => any;
