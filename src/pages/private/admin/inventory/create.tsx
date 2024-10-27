/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { RcFile, UploadChangeParam } from 'antd/es/upload/interface';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { TextArea } = Input;
const { Option } = Select;

export const CreateInventoryPage = () => {
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,setLoading] = useState(false)
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    // Fetch categories for the select input
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesList.slice(1));
      } catch (error) {
        console.error('Error fetching categories:', error);
        message.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [db]);

  const handleImageUpload = (file: RcFile) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    return false; // Prevent automatic upload
  };

  const handleSubmit = async (values: any) => {
    if (!imageFile) {
      message.error('Please upload a product image');
      return;
    }

    try {
      // Upload the image to Firebase Storage
      setLoading(true)
      const storageRef = ref(storage, `product-images/${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Add the product data to Firestore
      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...values,
        createdAt: serverTimestamp(),
        image: imageUrl,
      });
      message.success('Product created successfully!');
      form.resetFields();
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating product:', error);
      message.error('Failed to create product');
    } finally {
        setLoading(false)
    }
  };

  return (
    <div className="flex flex-col justify-center items-center" style={{ padding: '20px' }}>
      <h2>Create New Product</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className='w-[90%]'
      >

                <Form.Item
          label="Product Image"
          name="image"
          valuePropName="fileList"
          className='w-full flex justify-center items-center'
          getValueFromEvent={(e: UploadChangeParam) => e.fileList}
          rules={[{ required: true, message: 'Please upload a product image' }]}
        >
          <Upload
            listType="picture"
            beforeUpload={handleImageUpload}
            maxCount={1}
            showUploadList={false}
          >
                    {imagePreview ? (
          <Form.Item label="Image Preview" >
            <img
              className='w-[200px] h-[200px] cursor-pointer'
              src={imagePreview}
              alt="Product Image Preview"
            />
          </Form.Item>
        ) : <Button icon={<UploadOutlined />}>Upload</Button>}
            
          </Upload>
        </Form.Item>
        <div className='flex flex-nowrap w-full gap-4'>
        <Form.Item
          label="Product Name"
          name="name"
          className='flex-1'
          rules={[{ required: true, message: 'Please enter the product name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Category"
          name="category"
          className='flex-1'
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select a category">
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option>
            ))}
          </Select>
        </Form.Item>
        </div>
        <div className='flex flex-nowrap w-full gap-4'>
        <Form.Item
          label="Price"
          name="price"
          className='flex-1'
          rules={[{ required: true, message: 'Please enter the product price' }]}
        >
          <Input type="number" prefix="₱" />
        </Form.Item>
        <Form.Item
          label="Stock"
          name="stock"
          className='flex-1'
          rules={[{ required: true, message: 'Please enter the stock quantity' }]}
        >
          <Input type="number" />
        </Form.Item>
        </div>
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select the status' }]}
        >
          <Select placeholder="Select status">
            <Option value="available">Available</Option>
            <Option value="out_of_stock">Out of Stock</Option>
          </Select>
        </Form.Item>

        <Form.Item className='flex justify-end'>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Product
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
