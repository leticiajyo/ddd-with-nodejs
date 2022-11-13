import {Sequelize} from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
    let sequelize: Sequelize;
    let customerRepository: CustomerRepository;
    let productRepository: ProductRepository;
    let orderRepository: OrderRepository;

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false,
            sync: {force: true},
        });

        await sequelize.addModels([
            CustomerModel,
            OrderModel,
            OrderItemModel,
            ProductModel,
        ]);
        await sequelize.sync();

        customerRepository = new CustomerRepository();
        productRepository = new ProductRepository();
        orderRepository = new OrderRepository();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("should create a new order", async () => {
        const customer = await createCustomer('123')
        const product = await createProduct('123', 10)
        const orderItem = await createOrderItem('123', 2, product)

        const order = new Order("123", customer.id, [orderItem]);

        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        expect(orderModel.toJSON()).toStrictEqual({
            id: "123",
            customer_id: customer.id,
            total: order.total(),
            items: [
                {
                    id: orderItem.id,
                    name: orderItem.name,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    order_id: "123",
                    product_id: product.id,
                },
            ],
        });
    });

    it("should update an order", async () => {
        const customer = await createCustomer('456')
        const product = await createProduct('456', 10)
        const orderItem = await createOrderItem('456', 2, product)

        const order = new Order("456", customer.id, [orderItem]);

        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        expect(orderModel.toJSON()).toStrictEqual({
            id: "456",
            customer_id: customer.id,
            total: order.total(),
            items: [
                {
                    id: orderItem.id,
                    name: orderItem.name,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    order_id: "456",
                    product_id: product.id,
                },
            ],
        });

        const newCustomer = await createCustomer('789')
        const newProduct = await createProduct('789', 20)
        const newOrderItem = await createOrderItem('789', 10, newProduct)

        order.changeCustomer(newCustomer.id)
        order.changeItems([newOrderItem])

        await orderRepository.update(order)

        const updatedOrderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        expect(updatedOrderModel.toJSON()).toStrictEqual({
            id: "456",
            customer_id: newCustomer.id,
            total: updatedOrderModel.total,
            items: [
                {
                    id: newOrderItem.id,
                    name: newOrderItem.name,
                    price: newOrderItem.price,
                    quantity: newOrderItem.quantity,
                    order_id: "456",
                    product_id: newProduct.id,
                },
            ],
        });
    });

    it("should find an order", async () => {
        const customer = await createCustomer('123')
        const product = await createProduct('123', 30)
        const orderItem = await createOrderItem('123', 3, product)

        const order = new Order("123", customer.id, [orderItem]);

        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        const foundOrder = await orderRepository.find(order.id);

        expect(orderModel.toJSON()).toStrictEqual({
            id: foundOrder.id,
            customer_id: foundOrder.customerId,
            total: foundOrder.total(),
            items: [
                {
                    id: foundOrder.items[0].id,
                    name: foundOrder.items[0].name,
                    price: foundOrder.items[0].price,
                    quantity: foundOrder.items[0].quantity,
                    order_id: foundOrder.id,
                    product_id: product.id,
                },
            ],
        });
    });


    async function createCustomer(id: string): Promise<Customer> {
        const customer = new Customer(id, `Customer ${id}`);
        const address = new Address(`Street ${id}`, 1, `Zipcode ${id}`, `City ${id}`);
        customer.changeAddress(address);
        await customerRepository.create(customer);
        return customer
    }

    async function createProduct(id: string, price: number): Promise<Product> {
        const product = new Product(id, `Product ${id}`, price);
        await productRepository.create(product);
        return product
    }

    async function createOrderItem(id: string, quantity: number, product: Product): Promise<OrderItem> {
        return new OrderItem(
            id,
            product.name,
            product.price,
            product.id,
            quantity
        );
    }
});
