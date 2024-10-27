/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Image, Table, message, Button, Modal, Form, Input, InputNumber, Tag, Select, Row, Col } from 'antd';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Category, Product } from '../../../../types';
import { currencyFormat } from '../../../../utils/utils';
import Swal from 'sweetalert2';

const { Option } = Select;

const getStockStatusTag = (stock: number) => {
  if (stock < 10) {
    return <Tag color="red">{stock}</Tag>;
  } else if (stock < 30) {
    return <Tag color="orange">{stock}</Tag>;
  } else {
    return <Tag color="green">{stock}</Tag>;
  }
};

export const InventoryListPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const db = getFirestore();

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const productsList: Product[] = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesList: Category[] = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];

        const productsWithCategory = productsList.map((product) => {
          const category = categoriesList.find((cat) => cat.id === product.category);
          return {
            ...product,
            categoryName: category ? category.name : 'Unknown Category',
          };
        });

        setProducts(productsWithCategory);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        message.error('Failed to load inventory data');
      }
    };

    fetchInventoryData();
  }, [db]);

  // Filter and sort the products based on search and sort option
  const filteredAndSortedProducts = products
    .filter((product) => product.name?.toLowerCase().includes(searchKeyword.toLowerCase()))

  // Edit Product Handler
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalVisible(true);
  };

  // Delete Product Handler
  const handleDelete = async (productId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter((product) => product.id !== productId));
        Swal.fire('Deleted!', 'Your product has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error!', 'Failed to delete product.', 'error');
      }
    }
  };

  // Modal Submit Handler
  const handleModalSubmit = async (values: any) => {
    if (editingProduct) {
      try {
        const productDocRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productDocRef, values);
        setProducts(
          products.map((product) =>
            product.id === editingProduct.id ? { ...product, ...values } : product
          )
        );
        message.success('Product updated successfully');
        setIsModalVisible(false);
        setEditingProduct(null);
      } catch (error) {
        console.error('Error updating product:', error);
        message.error('Failed to update product');
      }
    }
  };

  // Modal Cancel Handler
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  // Define columns for the table
  const columns = [
    {
      title: 'Image',
      key: 'image',
      render: (_text: any, record: any) => (
        <Image width={70} height={70} className="rounded-md" src={record.image} alt={record.name} />
      ),
      width: '70px',
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: any) => <p className="line-clamp-2 w-[300px]">{v}</p>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${currencyFormat(price)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => getStockStatusTag(stock),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',

    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_text: any, record: Product) => (
        <div>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 className='text-4xl mb-4 font-sans font-bold text-gray-700'>Inventory List</h2>

      {/* Search and Sort Options */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <Input
            placeholder="Search Product"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredAndSortedProducts}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Edit Product"
        visible={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form
          initialValues={editingProduct || {}}
          onFinish={handleModalSubmit}
          layout="vertical"
        >
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${currencyFormat(value as number)}`}
            />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
