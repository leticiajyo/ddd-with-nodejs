import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";

export default class OrderRepository implements OrderRepositoryInterface {
    async create(entity: Order): Promise<void> {
        await OrderModel.create(
            {
                id: entity.id,
                customer_id: entity.customerId,
                total: entity.total(),
                items: entity.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
            },
            {
                include: [{model: OrderItemModel}],
            }
        );
    }


    async update(entity: Order): Promise<void> {
        await OrderModel.update(
            {
                customer_id: entity.customerId,
            },
            {
                where: {
                    id: entity.id,
                },
            }
        );

        // Sequelize does not support updating/deleting with associations in a single step yet
        // https://github.com/sequelize/sequelize/issues/11836
        await OrderItemModel.destroy(
            {
                where: {
                    order_id: entity.id,
                },
            }
        );
        for (const dbOrderItem of entity.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            order_id: entity.id,
            quantity: item.quantity,
        }))) {
            await OrderItemModel.create(dbOrderItem)
        }
    }

    async find(id: string): Promise<Order> {
        return Promise.resolve(undefined);
    }

    async findAll(): Promise<Order[]> {
        return Promise.resolve([]);
    }
}
