/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Card, Col, DatePicker, Row, Select, Table } from 'antd';
import { Order } from '../../../../types';
import { format } from 'date-fns';
import { currencyFormat } from '../../../../utils/utils';
import dayjs, { Dayjs } from "dayjs";

export const StaffSalesPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(dayjs());
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs());
  const db = getFirestore();

  const getDefaultDate = (filterType: string): Dayjs => {
    switch (filterType) {
      case "weekly":
        return selectedWeek;
      case "monthly":
        return selectedMonth;
      case "yearly":
        return selectedYear;
      default:
        return dayjs();
    }
  };

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
        setFilteredOrders(ordersList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [db]);

  const filterOrdersByTimeRange = (
    ordersList: any[],
    filterType: string,
    date: Dayjs
  ) => {
    return ordersList.filter((order) => {
      const orderTimestamp = order.timestamp;
      if (!orderTimestamp || !orderTimestamp.seconds) {
        return false;
      }

      const orderDate = dayjs(orderTimestamp.seconds * 1000);

      switch (filterType) {
        case "daily":
          return orderDate.isSame(date, "day");
        case "weekly":
          return orderDate.isSame(date, "week");
        case "monthly":
          return orderDate.isSame(date, "month");
        case "yearly":
          return orderDate.isSame(date, "year");
        default:
          return true;
      }
    });
  };

  const calculateTotals = () => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
    const totalOrders = filteredOrders.length;
    const totalPayment = filteredOrders.reduce((sum, order) => sum + Number(order.paymentAmount), 0);
    const totalChange = filteredOrders.reduce((sum, order) => sum + Number(order.change), 0);

    return {
      totalSales,
      totalOrders,
      totalPayment,
      totalChange,
    };
  };

  const { totalSales, totalOrders, totalPayment, totalChange } = calculateTotals();

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
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Sales" bordered={false} className="bg-gray-100">
            {currencyFormat(totalSales)}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Orders" bordered={false} className="bg-gray-100">
            {totalOrders}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Payment" bordered={false} className="bg-gray-100">
            {currencyFormat(totalPayment)}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Change" bordered={false} className="bg-gray-100">
            {currencyFormat(totalChange)}
          </Card>
        </Col>
      </Row>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl">Sales Orders</h2>
        <div className="flex gap-4">
          <div className="flex gap-4">
            {/* Filter Type Selector */}
            <Select
              defaultValue="all"
              onChange={(value) => {
                setFilterType(value);
                if (value === "all") {
                  setFilteredOrders(orders); // Reset filter
                } else {
                  setFilteredOrders(
                    filterOrdersByTimeRange(
                      orders,
                      value,
                      getDefaultDate(value)
                    )
                  );
                }
              }}
              className="w-40"
            >
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="yearly">Yearly</Select.Option>
            </Select>

            {/* Weekly Filter */}
            {filterType === "weekly" && (
              <DatePicker
                picker="week"
                onChange={(date) => {
                  setSelectedWeek(date || dayjs());
                  setFilteredOrders(
                    filterOrdersByTimeRange(orders, "weekly", date || dayjs())
                  );
                }}
              />
            )}

            {/* Monthly Filter */}
            {filterType === "monthly" && (
              <DatePicker
                picker="month"
                onChange={(date) => {
                  setSelectedMonth(date || dayjs());
                  setFilteredOrders(
                    filterOrdersByTimeRange(orders, "monthly", date || dayjs())
                  );
                }}
              />
            )}

            {/* Yearly Filter */}
            {filterType === "yearly" && (
              <DatePicker
                picker="year"
                onChange={(date) => {
                  setSelectedYear(date || dayjs());
                  setFilteredOrders(
                    filterOrdersByTimeRange(orders, "yearly", date || dayjs())
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
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
