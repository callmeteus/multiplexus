import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./User";

@Table({
    tableName: "user_plugins",
    timestamps: true
})
export class UserPlugin extends Model {
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare userId: number;

    @BelongsTo(() => User, { constraints: false })
    declare user: User;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare pluginName: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isEnabled: boolean;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare config: string;
}
