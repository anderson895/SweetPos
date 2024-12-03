/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Table, Card, Statistic, Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, BarChart } from 'recharts';
import { format } from 'date-fns';
import { Category, Order } from '../../../../types';

export const AdminHomepage = () => {
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersCollectionRef = collection(db, "orders");
        const ordersSnapshot = await getDocs(ordersCollectionRef);
        const ordersList = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        ordersList.shift()
        setOrderCount(ordersList.slice(1).length);

        const totalIncomeValue = ordersList.reduce(
          (sum, order: any) => Number(sum) + (Number(order.grandTotal) || 0),
          0
        );
        setTotalIncome(totalIncomeValue);

        const recentOrdersQuery = query(
          ordersCollectionRef,
          orderBy("timestamp", "desc")
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrdersList = recentOrdersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setRecentOrders(recentOrdersList.slice(0, 5));

        const productSales: { [key: string]: number } = {};
        ordersList.slice(1).forEach((order) => {
          order.cartItems.forEach((item: any) => {
            if (item.productName) { // Check if productName is defined
              productSales[item.productName] =
                (productSales[item.productName] || 0) +
                item.quantity * item.price;
            }
          });
        });
        
        const productData = Object.keys(productSales).map((productName) => ({
          name: productName,
          sales: productSales[productName],
        }));
        setProductData(productData);

        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesList: Category[] = categoriesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as Category[];
        categoriesList.shift()
        const categoryCounts: { [key: string]: number } = {};
        ordersList.slice(1).forEach((order) => {
          order.cartItems.forEach((item: any) => {
            const category = categoriesList.find(
              (v: Category) => v.name === item.category
            )?.name;
            if (category) {
              categoryCounts[category] =
                (categoryCounts[category] || 0) + item.quantity * item.price;
            }
          });
        });

        const categoryData = Object.keys(categoryCounts).map((category) => ({
          name: category,
          sales: categoryCounts[category],
        }));
        setCategoryData(categoryData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [db]);

  const columns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
    },
    {
      title: "Grand Total",
      dataIndex: "grandTotal",
      key: "grandTotal",
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: any) =>
        format(timestamp?.toDate(), "MMMM dd, yyyy HH:mm:ss"),
    },
  ];

  return (
    <div className="min-h-screen p-4">
      <h2 className="text-3xl mb-4">Dashboard</h2>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic title="Total Income" value={totalIncome} prefix="₱" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Number of Orders" value={orderCount} />
          </Card>
        </Col>
      </Row>
      <Card title="Recent Orders" className="mb-4">
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
        />
      </Card>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Product Sales">
            <BarChart
              width={600}
              height={300}
              data={productData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Category Sales">
            <LineChart width={600} height={300} data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#82ca9d" />
            </LineChart>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

