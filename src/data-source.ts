import "dotenv/config" // Loads .env file into process.env
import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    username: process.env.PGUSER || "einvoice_app_user",
    password: process.env.PGPASSWORD || "12121212",
    database: process.env.PGDATABASE || "uae_einvoice_db",
    synchronize: false,
    logging: false,
    entities: [__dirname + "/entities/**/*.ts"],
    migrations: [__dirname + "/migrations/**/*.ts"],
    subscribers: [],
})
