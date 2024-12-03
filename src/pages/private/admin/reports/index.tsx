/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { Card, DatePicker, Select } from "antd";
import {
  CartesianGrid,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);

export interface Category {
  id: string;
  name: string;
}

export const AdminReportsPage = () => {
  const [productData, setProductData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("daily");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const db = getFirestore();

  // Filter orders based on selected time range
  const filterOrdersByTimeRange = (ordersList: any[], filterType: string, date: Dayjs) => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders from Firestore
        const ordersCollectionRef = collection(db, "orders");
        const ordersSnapshot = await getDocs(ordersCollectionRef);
        const ordersList = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        ordersList.shift()
        // Filter orders based on the selected date and range
        const filteredOrders = filterOrdersByTimeRange(ordersList, filterType, selectedDate);

        // Calculate product sales
        const productSales: { [key: string]: number } = {};
        filteredOrders.forEach((order) => {
          order.cartItems.forEach((item: any) => {
            productSales[item.productName] =
              (productSales[item.productName] || 0) + item.quantity * item.price;
          });
        });

        const productData = Object.keys(productSales).map((productName) => ({
          name: productName,
          sales: productSales[productName],
        }));
        setProductData(productData);

        // Fetch categories from Firestore
        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesList: Category[] = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          ...doc.data(),
        }));
        categoriesList.shift()
        // Calculate sales per category
        const categoryCounts: { [key: string]: number } = {};
        filteredOrders.forEach((order) => {
          console.log(order)
          order.cartItems.forEach((item: any) => {
            if (!item.category) return; // Skip items without a valid categoryId
            const matchedCategory = categoriesList.find((cat) => cat.name === item.category);
            if (matchedCategory) {
              categoryCounts[matchedCategory.name] =
                (categoryCounts[matchedCategory.name] || 0) + item.quantity * item.price;
            }
          });
        });
        console.log(categoryCounts)
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
  }, [db, filterType, selectedDate]);

  return (
    <div className="flex flex-col gap-8 flex-nowrap">
      <div className="flex justify-end mb-4 gap-4 items-center">
        <Select
          value={filterType}
          onChange={(value) => setFilterType(value)}
          style={{ width: 200 }}
        >
          <Select.Option value="daily">Daily</Select.Option>
          <Select.Option value="weekly">Weekly</Select.Option>
          <Select.Option value="monthly">Monthly</Select.Option>
          <Select.Option value="yearly">Yearly</Select.Option>
        </Select>

        {filterType === "weekly" && (
          <DatePicker
            picker="week"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
          />
        )}
        {filterType === "monthly" && (
          <DatePicker
            picker="month"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
          />
        )}
        {filterType === "yearly" && (
          <DatePicker
            picker="year"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
          />
        )}
      </div>

      <Card title="Product Sales" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={productData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Category Sales" className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="sales" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
