// /* eslint-disable react-hooks/exhaustive-deps */
// import { collection, getDocs, orderBy, query } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { db } from "../../../../db";
// import { Order } from "../../../../types";
// import { Card, DatePicker } from "antd";
// import moment from "moment";

// export const IncomPage = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [dailyIncome, setDailyIncome] = useState(0);
//   const [weeklyIncome, setWeeklyIncome] = useState(0);
//   const [monthlyIncome, setMonthlyIncome] = useState(0);
//   const [yearlyIncome, setYearlyIncome] = useState(0);
//   const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         const ordersCollectionRef = collection(db, "orders");
//         const ordersQuery = query(
//           ordersCollectionRef,
//           orderBy("timestamp", "desc")
//         );
//         const ordersSnapshot = await getDocs(ordersQuery);
//         const ordersList: Order[] = ordersSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//           timestamp: doc.data().timestamp.toDate(), // Convert Firebase Timestamp to JavaScript Date
//         })) as Order[];

//         setOrders(ordersList);
//         calculateIncomes(ordersList);
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       }
//     };

//     fetchOrders();
//   }, [db]);

//   const calculateIncomes = (orders: Order[]) => {
//     const now = moment();

//     // Daily Income
//     const daily = orders
//       .filter((order) => moment(order.timestamp).isSame(now, "day"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setDailyIncome(daily);

//     // Weekly Income
//     const weekly = orders
//       .filter((order) => moment(order.timestamp).isSame(now, "week"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setWeeklyIncome(weekly);

//     // Monthly Income
//     const monthly = orders
//       .filter((order) => moment(order.timestamp).isSame(now, "month"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setMonthlyIncome(monthly);

//     // Yearly Income
//     const yearly = orders
//       .filter((order) => moment(order.timestamp).isSame(now, "year"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setYearlyIncome(yearly);
//   };

//   const handleDateChange = (date: moment.Moment | null) => {
//     setSelectedDate(date);
//     if (!date) {
//       calculateIncomes(orders);
//       return;
//     }

//     const daily = orders
//       .filter((order) => moment(order.timestamp).isSame(date, "day"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setDailyIncome(daily);

//     const weekly = orders
//       .filter((order) => moment(order.timestamp).isSame(date, "week"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setWeeklyIncome(weekly);

//     const monthly = orders
//       .filter((order) => moment(order.timestamp).isSame(date, "month"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setMonthlyIncome(monthly);

//     const yearly = orders
//       .filter((order) => moment(order.timestamp).isSame(date, "year"))
//       .reduce((acc, order) => acc + Number(order.grandTotal), 0);
//     setYearlyIncome(yearly);
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-semibold mb-4">Income Page</h2>

//       {/* Date Picker */}
//       <div className="mb-4">
//         <DatePicker
//           onChange={handleDateChange}
//           style={{ width: 300 }}
//           placeholder="Select a date to filter"
//         />
//       </div>

//       {/* Cards Section */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         <Card
//           title="Daily Income"
//           bordered={false}
//           className="shadow-md text-center"
//         >
//           <p className="text-2xl font-bold text-blue-500">
//             ${dailyIncome?.toFixed(2)}
//           </p>
//         </Card>
//         <Card
//           title="Weekly Income"
//           bordered={false}
//           className="shadow-md text-center"
//         >
//           <p className="text-2xl font-bold text-green-500">
//             ${weeklyIncome?.toFixed(2)}
//           </p>
//         </Card>
//         <Card
//           title="Monthly Income"
//           bordered={false}
//           className="shadow-md text-center"
//         >
//           <p className="text-2xl font-bold text-yellow-500">
//             ${monthlyIncome?.toFixed(2)}
//           </p>
//         </Card>
//         <Card
//           title="Yearly Income"
//           bordered={false}
//           className="shadow-md text-center col-span-1 sm:col-span-2 lg:col-span-3"
//         >
//           <p className="text-2xl font-bold text-purple-500">
//             ${yearlyIncome?.toFixed(2)}
//           </p>
//         </Card>
//       </div>
//     </div>
//   );
// };
