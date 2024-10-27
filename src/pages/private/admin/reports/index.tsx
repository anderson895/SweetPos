/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { Category, Order } from '../../../../types';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { Card } from 'antd';
import { CartesianGrid, Line, LineChart, Bar, BarChart, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const AdminReportsPage = () => {
    const [productData, setProductData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const db = getFirestore();

    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch orders and calculate total income and order count
          const ordersCollectionRef = collection(db, 'orders');
          const ordersSnapshot = await getDocs(ordersCollectionRef);
          const ordersList = ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Order[];
  
          // Aggregate product sales data from orders
          const productSales: { [key: string]: number } = {};
          ordersList.slice(1).forEach(order => {
            order.cartItems.forEach((item: any) => {
              productSales[item.productName] = (productSales[item.productName] || 0) + (item.quantity * item.price);
            });
          });
  
          const productData = Object.keys(productSales).map(productName => ({
            name: productName,
            sales: productSales[productName]
          }));
          setProductData(productData);
  
          const categoriesRef = collection(db, 'categories');
          const categoriesSnapshot = await getDocs(categoriesRef);
          const categoriesList: Category[] = categoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Category[];
      
          // Aggregate category data
          const categoryCounts: { [key: string]: number } = {};
          ordersList.slice(1).forEach(order => {
            order.cartItems.forEach((item: any) => {
              const category = categoriesList.find((v: Category) => v.name === item.category)?.name;
              if (category) {
                categoryCounts[category] = (categoryCounts[category] || 0) + (item.quantity * item.price);
              }
            });
          });
      
          const categoryData = Object.keys(categoryCounts).map(category => ({
            name: category,
            sales: categoryCounts[category]
          }));
          setCategoryData(categoryData);
        } catch (error) {
          console.error('Error fetching data:', error);
          // Optionally, set an error state to show a message to the user
        }
      };
  
      fetchData();
    }, [db]);

  return (
    <div className='flex flex-col gap-8 flex-nowrap'>
        <Card title="Product Sales" className='w-full'>
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
        <Card title="Category Sales" className='w-full'>
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
  )
}
