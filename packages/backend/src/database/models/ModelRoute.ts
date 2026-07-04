import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Provider } from "./Provider";

@Table({
    tableName: "model_routes",
    timestamps: true
})
export class ModelRoute extends Model {
    /**
     * The ID of the model route.
     */
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;

    /**
     * The model that will be used to route the request to the appropriate provider.
     * @example "gpt-4o"
     */
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare routerModel: string;

    /**
     * The ID of the provider that will be used to route the request to the appropriate provider.
     */
    @ForeignKey(() => Provider)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare providerId: number;

    /**
     * The provider that will be used to route the request to the appropriate provider.
     */
    @BelongsTo(() => Provider, {
        constraints: false
    })
    declare provider: any;

    /**
     * The model that will be used to route the request to the appropriate provider.
     * @example "gpt-4o-mini"
     */
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare providerModel: string;

    /**
     * The priority of the model route.
     * Lower will be tried first.
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare priority: number;

    /**
     * The weight of the model route.
     * For load balancing among same priority.
     * Lower will be tried first.
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare weight: number;

    /**
     * Whether the model route is active.
     * @example true
     */
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    declare isActive: boolean;
}
