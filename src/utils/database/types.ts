export type FieldData = "TEXT" | "INTEGER" | "FLOAT" | "BOOL" | "TIMESTAMP" | "JSON";

export type TableDefinition = {
  name: string;
  definition: Record<string, FieldData>;
};

export type SqlType<T extends FieldData> = {
  BOOL: boolean;
  INTEGER: number;
  FLOAT: number;
  TEXT: string;
  TIMESTAMP: Date;
  JSON: any;
}[T];

export type TypeOfDefinition<T extends TableDefinition> = {
  [K in keyof T["definition"]]: SqlType<T["definition"][K]>;
};
