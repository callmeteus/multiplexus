import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import { ApiType } from "@multiplexus/shared";
import { ProviderKey } from "./ProviderKey";
import { ModelRoute } from "./ModelRoute";

@Table({
    tableName: "providers",
    timestamps: true
})
export class Provider extends Model {
    /**
     * The ID of the provider.
     * @example 1
     */
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    /**
     * The name of the provider.
     * @example "openai"
     */
    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare name: string;

    /**
     * The API type of the provider.
     */
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare apiType: ApiType;

    /**
     * The base URL of the provider.
     * @example "https://api.openai.com/v1"
     */
    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare baseUrl: string;

    @HasMany(() => ProviderKey, {
        onDelete: "CASCADE",
        hooks: true,
        constraints: false
    })
    declare keys: ProviderKey[];

    @HasMany(() => ModelRoute, {
        onDelete: "CASCADE",
        hooks: true,
        constraints: false
    })
    declare routes: ModelRoute[];
}
