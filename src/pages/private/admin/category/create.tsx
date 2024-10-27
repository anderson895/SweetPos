/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Form, Input, Button, Upload, message, Select, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { RcFile, UploadChangeParam } from 'antd/es/upload/interface';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { TextArea } = Input;
const { Option } = Select;

export const CreateCategoryPage = () => {
  const [loading,setLoading] = useState(false)
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const db = getFirestore();
  const storage = getStorage();

  const handleImageUpload = (file: RcFile) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
    return false; // Prevent automatic upload
  };

  const handleSubmit = async (values: any) => {
    if (!imageFile) {
      message.error('Please upload a category image');
      return;
    }

    try {
        setLoading(true)
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `category-images/${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);
      console.log(values)
      console.log(imageUrl)
      // Add the category data to Firestore
      const categoriesRef = collection(db, 'categories');
      await addDoc(categoriesRef, {
        ...values,
        image:imageUrl,
      });
      setLoading(false)
      message.success('Category created successfully!');
      form.resetFields();
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating category:', error);
      setLoading(false)
      message.error('Failed to create category');
    }
  };

  return (
    <div className="create-category-page" style={{ padding: '20px' }}>
      <h2>Create New Category</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Category Image"
          name="image"
          valuePropName="fileList"
          getValueFromEvent={(e: UploadChangeParam) => e.fileList}
          rules={[{ required: true, message: 'Please upload a category image' }]}
        >
          <Upload
            listType="picture"
            beforeUpload={handleImageUpload}
            showUploadList={false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>

        {imagePreview && (
          <div style={{ marginTop: '10px' }}>
            <Image
              width={200}
              src={imagePreview}
              alt="Category Preview"
            />
          </div>
        )}

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
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select the status' }]}
        >
          <Select placeholder="Select status">
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button loading={loading} type="primary" htmlType="submit">
            Create Category
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
