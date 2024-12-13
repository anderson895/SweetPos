/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  Table,
  Button,
  Select,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  DatePicker,
  Row,
  Col,
  Card,
} from "antd";
import { format } from "date-fns";
import { currencyFormat } from "../../../../utils/utils";
import { saveAs } from "file-saver";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;

interface Order {
  id: string;
  cartItems: any[];
  subtotal: number;
  grandTotal: number;
  paymentAmount: number;
  change: number;
  paymentMethod: string;
  totalItems: number;
  timestamp: Timestamp | Date;
}

export const AdminSalesPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(dayjs());
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();
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
        const ordersCollectionRef = collection(db, "orders");
        const ordersQuery = query(
          ordersCollectionRef,
          orderBy("timestamp", "desc")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersList: Order[] = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
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

  // Add new sale
  const addSale = async (values: any) => {
    try {
      const newOrder = {
        ...values,
        timestamp: Timestamp.fromDate(new Date()),
        cartItems: Array(values.totalItems).fill({}),
      };
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      const addedOrder = { id: docRef.id, ...newOrder };
      setOrders((prev) => [addedOrder, ...prev]);
      setFilteredOrders((prev) => [addedOrder, ...prev]);
      setAddModalVisible(false);
      form.resetFields();
      message.success("Sale added successfully!");
    } catch (error) {
      console.error("Error adding sale:", error);
      message.error("Failed to add sale.");
    }
  };

  // Delete sale
  const deleteSale = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
      setOrders((prev) => prev.filter((order) => order.id !== id));
      setFilteredOrders((prev) => prev.filter((order) => order.id !== id));
      message.success("Sale deleted successfully!");
    } catch (error) {
      console.error("Error deleting sale:", error);
      message.error("Failed to delete sale.");
    }
  };

  // Export filtered orders to CSV
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      message.warning("No sales data available for export.");
      return;
    }

    const csvHeaders = [
      "Order ID,Total Items,Subtotal,Grand Total,Payment Amount,Change,Payment Method,Date & Time",
    ];
    const csvRows = filteredOrders.map((order) => {
      const formattedDate = format(
        order.timestamp instanceof Date
          ? order.timestamp
          : order.timestamp.toDate(),
        "MMMM dd, yyyy HH:mm:ss"
      );
      return [
        order.id,
        order.totalItems,
        order.subtotal,
        order.grandTotal,
        order.paymentAmount,
        order.change,
        order.paymentMethod,
        formattedDate,
      ].join(",");
    });

    const csvContent = [csvHeaders.join("\n"), csvRows.join("\n")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `sales.csv`);
    message.success("Sales data exported successfully!");
  };

  const calculateTotals = () => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
    const totalOrders = filteredOrders.length;
    const totalPayment = filteredOrders.reduce((sum, order) => Number(sum) + Number(order.paymentAmount), 0);
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
      title: "Order ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Total Items",
      dataIndex: "cartItems",
      render:(v:any) => `${v?.length}`,
      key: "totalItems",
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: "Grand Total",
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: "Payment Amount",
      dataIndex: "paymentAmount",
      key: "paymentAmount",
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: "Change",
      dataIndex: "change",
      key: "change",
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Reference Number",
      dataIndex: "gcashReference",
      key: "paymentMethod",
    },
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: any) =>
        format(timestamp?.toDate(), "MMMM dd, yyyy HH:mm:ss"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Order) => (
        <div className="flex gap-2">
          <Popconfirm
            title="Are you sure you want to delete this sale?"
            onConfirm={() => deleteSale(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
  console.log(filteredOrders)
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

          <Button type="primary" onClick={() => setAddModalVisible(true)}>
            Add Sale
          </Button>
          <Button type="primary" onClick={exportToCSV}>
            Export to CSV
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* Add Sale Modal */}
      <Modal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        title="Add New Sale"
        footer={null}
      >
        <Form layout="vertical" onFinish={addSale} form={form}>
          <Form.Item
            name="totalItems"
            label="Total Items"
            rules={[
              { required: true, message: "Please enter the total items." },
            ]}
          >
            <Input type="number" placeholder="Enter total items" />
          </Form.Item>
          <Form.Item
            name="subtotal"
            label="Subtotal"
            rules={[{ required: true, message: "Please enter the subtotal." }]}
          >
            <Input type="number" placeholder="Enter subtotal" />
          </Form.Item>
          <Form.Item
            name="grandTotal"
            label="Grand Total"
            rules={[
              { required: true, message: "Please enter the grand total." },
            ]}
          >
            <Input type="number" placeholder="Enter grand total" />
          </Form.Item>
          <Form.Item
            name="paymentAmount"
            label="Payment Amount"
            rules={[
              { required: true, message: "Please enter the payment amount." },
            ]}
          >
            <Input type="number" placeholder="Enter payment amount" />
          </Form.Item>
          <Form.Item
            name="change"
            label="Change"
            rules={[{ required: true, message: "Please enter the change." }]}
          >
            <Input type="number" placeholder="Enter change" />
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[
              { required: true, message: "Please select a payment method." },
            ]}
          >
            <Select placeholder="Select payment method">
              <Option value="Cash">Cash</Option>
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Online Transfer">Online Transfer</Option>
            </Select>
          </Form.Item>
          <div className="flex justify-end">
            <Button onClick={() => setAddModalVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Add Sale
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
