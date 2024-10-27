/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Image, Table, message, Button, Modal, Form, Input, InputNumber, Tag, Select, Row, Col, Tabs } from 'antd';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Category, Product } from '../../../../types';
import { currencyFormat } from '../../../../utils/utils';

const { Option } = Select;
const { TabPane } = Tabs;

const getStockStatusTag = (stock: number) => {
  if (stock < 10) {
    return <Tag color="red">{stock}</Tag>;
  } else if (stock < 30) {
    return <Tag color="orange">{stock}</Tag>;
  } else {
    return <Tag color="green">{stock}</Tag>;
  }
};

export const StaffInventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

  // Filter and sort the products based on search, sort option, and active category
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesCategory = activeCategory ? product.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'stock-asc') return a.stock - b.stock;
      if (sortOption === 'stock-desc') return b.stock - a.stock;
      return 0;
    });


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
        <Col span={12}>
          <Select
            placeholder="Sort By"
            value={sortOption}
            onChange={(value) => setSortOption(value)}
            style={{ width: '100%' }}
          >
            <Option value="price-asc">Price: Low to High</Option>
            <Option value="price-desc">Price: High to Low</Option>
            <Option value="stock-asc">Stock: Low to High</Option>
            <Option value="stock-desc">Stock: High to Low</Option>
          </Select>
        </Col>
      </Row>
      {/* Category Tabs */}
      <Tabs activeKey={activeCategory || ''} onChange={(key) => setActiveCategory(key)}>
        <TabPane tab="All" key="">
          <Table
            columns={columns}
            dataSource={filteredAndSortedProducts}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        {categories.map((category) => (
          <TabPane tab={category.name} key={category.id}>
            <Table
              columns={columns}
              dataSource={filteredAndSortedProducts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        ))}
      </Tabs>

      <Modal
        title="Edit Product"
        open={isModalVisible}
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
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="In Stock">In Stock</Option>
              <Option value="Out of Stock">Out of Stock</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
