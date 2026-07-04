import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./User";

@Table({
    tableName: "user_plugins",
    timestamps: true
})
export class UserPlugin extends Model {
    /**
     * The ID of the user.
     */
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    /**
     * The ID of the user.
     */
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare userId: number;

    @BelongsTo(() => User, { constraints: false })
    declare user: User;

    /**
     * The name of the plugin.
     */
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare pluginName: string;

    /**
     * Whether the plugin is enabled.
     */
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isEnabled: boolean;

    /**
     * The config of the plugin.
     */
    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare config: string;
}
