import { Sequelize } from "sequelize-typescript";
import { fileURLToPath } from "url";
import * as path from "path";
import { User } from "./models/User";
import { Provider } from "./models/Provider";
import { ProviderKey } from "./models/ProviderKey";
import { ModelRoute } from "./models/ModelRoute";
import { UserPlugin } from "./models/UserPlugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file at the backend package root directory dynamically
const dbPath = path.resolve(__dirname, "../../../multiplexus.db");

/**
 * The Sequelize instance for the database connection.
 */
export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
    models: [User, Provider, ProviderKey, ModelRoute, UserPlugin]
});

/**
 * Initializes the database connection and syncs the models.
 */
export async function initializeDatabase() {
    await sequelize.authenticate();
    await sequelize.sync();
}
