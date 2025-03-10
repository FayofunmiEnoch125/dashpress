enum RDMSSources {
  Postgres = "postgres",
  MySql = "mysql",
  MsSql = "mssql",
  Sqlite = "sqlite",
}

type IRDMSConnectionOptions = {
  dataSourceType: RDMSSources;
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  filename?: string;
  ssl?: boolean;
  schemaNames?: string[];
};

export type IDataSourceCredentials = IRDMSConnectionOptions;

const DATABASE_FIELDS: Array<keyof IDataSourceCredentials> = [
  "host",
  "user",
  "password",
  "database",
  "port",
  "ssl",
];

export const DATA_SOURCES_CONFIG: Record<
  string,
  {
    fields: Array<keyof IDataSourceCredentials>;
    port?: number;
    useConnectionString?: boolean;
    getQueryData: (input: any) => unknown;
  }
> = {
  [RDMSSources.Postgres]: {
    fields: DATABASE_FIELDS,
    port: 5432,
    useConnectionString: true,
    getQueryData: (data) => data.rows,
  },
  [RDMSSources.MsSql]: {
    fields: DATABASE_FIELDS,
    port: 1433,
    useConnectionString: true,
    getQueryData: (data) => data[0],
  },
  [RDMSSources.MySql]: {
    fields: DATABASE_FIELDS,
    port: 3306,
    useConnectionString: true,
    getQueryData: (data) => data,
  },
  [RDMSSources.Sqlite]: {
    fields: ["filename"],
    getQueryData: (data) => data,
  },
};
