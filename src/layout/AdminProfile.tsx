import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import useStore from '../zustand/store/store';
import { saveAdminInfo, selector } from '../zustand/store/store.provider';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../db';
import { updateEmail, updatePassword } from 'firebase/auth';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const AdminProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const user = useStore(selector('admin'))
  console.log(user.info)
  const [form] = Form.useForm();

  useEffect(() =>{
    if(user.info){
        form.setFieldsValue(user.info)
    }
  },[form, user.info])

  const handleOk = async() => {
    try {
        const values = await form.validateFields();
        console.log('Updated profile info:', values);
  
        // Reference to the Firestore document
        const userDocRef = doc(db, 'users', user.info.id); // Assuming `user.info.id` is the document ID
  
        // Update the Firestore document
        await updateDoc(userDocRef, {
          username: values.username,
          email: values.email,
          password: values.password, // Note: Storing plaintext passwords is not recommended
        });
        if (auth.currentUser) {
          if (values.email !== user.info.email) {
            await updateEmail(auth.currentUser, values.email);
          }
          if (values.password !== user.info.password) {
            await updatePassword(auth.currentUser, values.password);
          }
        }
        saveAdminInfo({
          id: user.info.id,
          username: values.username,
          email: values.email,
          password: values.password, // You can choose whether to store this in Zustand
        })
        message.success('Profile updated successfully');
        onClose();
      } catch (error) {
        console.log('Validate Failed:', error);
        message.error('Failed to update profile');
      }
  };

  return (
    <Modal
      title="Update Profile"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: 'Please input your email!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminProfileModal;
