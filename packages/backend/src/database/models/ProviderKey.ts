import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Provider } from "./Provider";

@Table({
    tableName: "provider_keys",
    timestamps: true
})
export class ProviderKey extends Model {
    /**
     * The ID of the provider key.
     * @example 1
     */
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    /**
     * The ID of the provider that the key belongs to.
     */
    @ForeignKey(() => Provider)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare providerId: number;

    @BelongsTo(() => Provider, {
        constraints: false
    })
    declare provider: any;

    /**
     * The value of the provider key.
     * @example "sk-1234567890"
     */
    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    declare keyValue: string;

    /**
     * The weight of the provider key.
     * @example 1
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare weight: number;

    /**
     * Whether the provider key is active.
     * @example true
     */
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    declare isActive: boolean;

    /**
     * The description of the provider key.
     * @example "This is a provider key for the OpenAI API."
     */
    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare description: string;
}
