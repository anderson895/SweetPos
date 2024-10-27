/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Table, Button, message, Modal, Form, Input, Avatar, Input as AntdInput, Pagination, PaginationProps } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { format } from 'date-fns';
import Swal from 'sweetalert2';

export const StaffListPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const db = getFirestore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(usersList.slice(1)); // Disregard the first user
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
      message.success("User deleted successfully");
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Error deleting user: ", error);
      message.error("Failed to delete user");
    }
  };

  const confirmDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      handleDelete(id);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue(user);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await updateDoc(doc(db, "users", editingUser.id), values);
      message.success("User updated successfully");
      setUsers(users.map((user) => (user.id === editingUser.id ? { ...user, ...values } : user)));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user: ", error);
      message.error("Failed to update user");
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredUsers = users.filter(user =>
    user.firstname.toLowerCase().includes(searchText.toLowerCase()) ||
    user.lastname.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Name",
      key: "username",
      dataIndex:'profilePicture',
      render: (v: any) => (
            <Avatar size={50} src={v} alt="" />
      ),
    },
    {
      title: "First Name",
      key: "firstname",
      dataIndex:'firstname',
      sorter: (a: any, b: any) => (a.firstname).localeCompare(b.firstname),
    },
    {
      title: "Last Name",
      key: "lastname",
      dataIndex:'lastname',
      sorter: (a: any, b: any) => (a.lastname).localeCompare(b.lastname),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a: any, b: any) => a.email.localeCompare(b.email),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      key: "date",
      render:((v:any) => <p>{format(v.toDate(), 'MMMM dd, yyyy')}</p>)
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <span>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => confirmDelete(record.id)}
          >
            Delete
          </Button>
        </span>
      ),
    },
  ];
  const itemRender: PaginationProps['itemRender'] = (_, type, originalElement) => {
    if (type === 'prev') {
      return <a className="ml-12">Previous</a>;
    }
    if (type === 'next') {
      return <a>Next</a>;
    }
    return originalElement;
  };
  return (
    <div>
        <h2 className="text-4xl font-bold font-sans text-gray-600">Staff List</h2>
      <div className="mb-4 flex items-center justify-end">
        <AntdInput.Search
          placeholder="Search users"
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    <Pagination
      total={filteredUsers.length}
      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
      defaultPageSize={5}
      defaultCurrent={1}
      align="end"
      className="mt-4"
      itemRender={itemRender}
    />
      <Modal
        title="Edit User"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={handleUpdate}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="First Name"
            name="firstname"
            rules={[{ required: true, message: "Please enter the first name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastname"
            rules={[{ required: true, message: "Please enter the last name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
