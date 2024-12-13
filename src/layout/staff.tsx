/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { MdOutlineInventory,MdPointOfSale } from "react-icons/md";
import { GrMoney } from "react-icons/gr";
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Popover, theme } from 'antd';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { RouterUrl } from '../routes';
import { logoutAdmin, selector } from '../zustand/store/store.provider';
import StaffProfileModal from './StaffProfile';
import useStore from '../zustand/store/store';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../db';
import { Category, Product } from '../types';

const { Header, Sider, Content } = Layout;
const LOW_STOCK_THRESHOLD = 10;
export default function StaffSide() {
  const user = useStore(selector('staff'))
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const productsRef = collection(db, "products");
        const productsSnapshot = await getDocs(productsRef);
        const productsList: Product[] = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesList: Category[] = categoriesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as Category[];
        const productsWithCategory = productsList.map((product) => {
          const category = categoriesList.find(
            (cat) => cat.id === product.category
          );
          return {
            ...product,
            categoryName: category ? category.name : "Unknown Category",
          };
        });
        const lowStockItems = productsList.filter(
          (product) => Number(product.stock) <= LOW_STOCK_THRESHOLD
        );
        setLowStockProducts(lowStockItems);
        setProducts(productsWithCategory);
      } catch (error) {
        console.error("Error fetching inventory data:", error);
      }
    };

    fetchInventoryData();
  }, [db]);

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const notificationMenu = (
    <Menu
      style={{
        maxHeight: "300px", // Set a maximum height for the dropdown
        overflowY: "auto", // Enable scrolling if items overflow
        padding: "10px",
      }}
    >
      {lowStockProducts.length === 0 ? (
        <Menu.Item style={{ textAlign: "center", color: "#888" }}>
          <span>No low-stock items</span>
        </Menu.Item>
      ) : (
        lowStockProducts.map((product) => (
          <Menu.Item
            key={product.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {/* Product Image */}
            {product.image ? (
              <Avatar
                src={product.image}
                alt={product.name}
                size={40}
                style={{ marginRight: "10px" }}
              />
            ) : (
              <Avatar
                size={40}
                style={{
                  marginRight: "10px",
                  backgroundColor: "#f56a00",
                  verticalAlign: "middle",
                }}
              >
                {product.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            
            {/* Product Details */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                {product.name}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Stock:{" "}
                <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                  {product.stock}
                </span>
                <div style={{ fontSize: "12px", color: "#444" }}>
              ⚠️ Stock is running low! Consider restocking this item soon.
            </div>
              </div>
            </div>
          </Menu.Item>
        ))
      )}
    </Menu>
  );
  console.log(products);

  const handleLogout = () => {
    // Implement your logout logic here
    console.log('Logging out...');
    logoutAdmin()
    navigate(RouterUrl.Login)
  };

  const popoverContent = (
    <Menu
      style={{ width: '100px' }}
      onClick={({ key }) => {
        if (key === 'logout') {
          handleLogout();
        } else if (key === 'settings') {
          setIsModalVisible(true); 
        }
      }}
      items={[
        { key: 'settings', label: 'Settings' },
        { key: 'logout', label: 'Logout' },
      ]}
    />
  );

  return !user.isAuthenticated ? (<Navigate replace to={RouterUrl.Login} />) : (
    <Layout className="h-max min-h-screen">
      <Sider
        width={'20%'}
        style={{ background: '#B0E0E6' }}
        className='custom-menu'
        trigger={null}
        collapsible
        collapsed={collapsed}
      >
        <div className='p-4'>
        {!collapsed ? (
      <>
        <p className='font-grand-hotel text-4xl text-white'>D’ Sweet Fix</p>
        <p className='text-white text-lg'>BAKING & CONFECTIONERY SHOP</p>
      </>
    ) : (
      <p className='font-grand-hotel text-2xl text-white'>D’SF</p>
    )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          style={{ background: '#B0E0E6', color: 'white' }}
          onClick={({ key }) => handleMenuClick(key)}
          items={[
            {
              key: RouterUrl.StaffDashboard,
              icon: <TbLayoutDashboardFilled />,
              label: 'Dashboard',
            },
            {
              key: '2',
              label: 'Features',
              style: { background: '#B0E0E6' },
              children: [
                {
                  key: RouterUrl.POS,
                  label: 'Point of Sale',
                  icon: <MdPointOfSale />,
                },
                {
                  key: RouterUrl.ProductList,
                  label: 'Inventory',
                  icon: <MdOutlineInventory />,
                },
                {
                  key: RouterUrl.Sales,
                  label: 'Sales',
                  icon: <GrMoney />,
                },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: '#FFD1DC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingRight: '12px'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
           <div className="flex gap-4 items-center">
           <Dropdown overlay={notificationMenu} trigger={["click"]}>
            <Badge count={lowStockProducts.length} offset={[-2, 7]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: "24px" }} />}
              />
            </Badge>
          </Dropdown>
          <Popover
            content={popoverContent}
            trigger="click"
            placement="bottomRight"
          >
           <Avatar src={user?.info?.profilePicture} style={{ cursor: 'pointer',backgroundColor: '#87d068' }} />
          </Popover>
           </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#FFD1DC',
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <StaffProfileModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </Layout>
  );
}
