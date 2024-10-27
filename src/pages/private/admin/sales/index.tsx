/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Table } from 'antd';
import { Order } from '../../../../types';
import { format } from 'date-fns';
import { currencyFormat } from '../../../../utils/utils';

export const AdminSalesPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const db = getFirestore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollectionRef = collection(db, 'orders');
        const ordersQuery = query(ordersCollectionRef, orderBy('timestamp', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersList: Order[] = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
            console.log(ordersList)
        // Skip the first document
        setOrders(ordersList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [db]);

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Total Items',
      dataIndex: 'cartItems',
      key: 'subtotal',
      render: (price: any) => `${price.length}`,
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: 'Payment Amount',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: any) => format(timestamp?.toDate(), 'MMMM dd, yyyy HH:mm:ss'),
    },
  ];

  const expandableContent = (record: Order) => (
    <Table
      dataSource={record.cartItems}
      columns={[
        {
          title: 'Product Name',
          dataIndex: 'productName',
          key: 'productName',
        },
        {
          title: 'Category',
          dataIndex: 'category',
          key: 'category',
        },
        {
          title: 'Quantity',
          dataIndex: 'quantity',
          key: 'quantity',
        },
        {
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          render: (price: number) => `${currencyFormat(price)}`,
        },
        {
          title: 'Total',
          dataIndex: 'total',
          key: 'total',
          render: (total: number) => `${currencyFormat(total)}`,
        },
      ]}
      pagination={false}
      rowKey="productId"
    />
  );

  return (
    <div className="min-h-screen p-4">
      <h2 className="text-3xl mb-4">Sales Orders</h2>
      <Table
        columns={columns}
        dataSource={orders}
        expandable={{
          expandedRowRender: expandableContent,
        }}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
