/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Table, Avatar, message, Button, Modal, Form, Input, Popconfirm, Select } from 'antd';
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const CategoryListPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [form] = Form.useForm();
  const db = getFirestore();

  useEffect(() => {
    fetchCategories();
  }, [db]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categoriesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesList.slice(1));
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await updateDoc(doc(db, 'categories', editingCategory.id), values);
      message.success('Category updated successfully!');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      message.error('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if the category is associated with any products
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const hasAssociatedProducts = productsSnapshot.docs.some((doc) => doc.data().categoryId === id);

      if (hasAssociatedProducts) {
        message.error('Cannot delete category as it is associated with one or more products');
        return;
      }

      await deleteDoc(doc(db, 'categories', id));
      message.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
    }
  };

  const columns = [
    {
      title: 'Image',
      key: 'image',
      render: (_text: any, record: any) => (
        <Avatar size={64} src={record.image} alt={record.name} />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'active' ? 'green' : 'red' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className='flex flex-col gap-2'>
          <Button
            type="link"
            className='bg-sky-600 text-white w-24'
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" className='bg-red-600 text-white w-24'>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="category-list-page" style={{ padding: '20px' }}>
      <h2>Category List</h2>
      <Table
        columns={columns}
        dataSource={categories}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Edit Category"
        visible={!!editingCategory}
        onCancel={() => setEditingCategory(null)}
        onOk={handleUpdate}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Please enter the category name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select the status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
