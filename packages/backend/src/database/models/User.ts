import { Table, Column, Model, DataType } from "sequelize-typescript";
import { UserRole } from "@multiplexus/shared";

@Table({
    tableName: "users",
    timestamps: true
})
export class User extends Model {
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
     * The name of the user.
     */
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string;

    /**
     * The API key of the user.
     */
    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare apiKey: string;

    /**
     * The role of the user.
     */
    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: UserRole.USER
    })
    declare role: UserRole;
}
