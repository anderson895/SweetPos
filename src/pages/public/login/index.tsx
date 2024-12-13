/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, Input, Button, message } from 'antd';
import { signInWithEmailAndPassword } from 'firebase/auth';
import DSweetBg from '../../../assets/bg.png';
import { auth, db } from '../../../db';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouterUrl } from '../../../routes';
import { saveAdminInfo, saveStaffInfo } from '../../../zustand/store/store.provider';
import { UserData } from '../../../types';

export const LoginPage = () => {
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)
    const onFinish = async (values: { Username: any; password: any; }) => {
        try {
          const { Username, password } = values;
          setLoading(true)
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', Username));
          const querySnapshot = await getDocs(q);
            console.log(q)
          if (querySnapshot.empty) {
            message.error('User not found!');
            setLoading(false)
            return;
          }
          const userDoc = querySnapshot.docs[0];

          const userData = {
         
            ...userDoc.data() as UserData,
            id: userDoc.id, // Include the document ID
          };
          console.log(userData)
          if (!userData.email || !userData.email.includes('@')) {
            throw new Error('Invalid email format');
          }
          
          // Use the associated email to sign in with Firebase Authentication
          await signInWithEmailAndPassword(auth, userData.email, password);
          setLoading(false)
          if(userData.type === 'admin'){
            saveAdminInfo(userData)
            message.success('Login successful!');
            navigate(RouterUrl.AdminDashboard)
          } else{
            saveStaffInfo(userData)
            message.success('Login successful!');
            navigate(RouterUrl.StaffDashboard)
          }

          // Additional logic, like redirecting the user, can go here
        } catch (error) {
          console.error('Login failed:', error);
          message.error('Login failed! Please check your username and password.');
        } finally{
          setLoading(false)
        }
    };
    

  return (
    <div className="flex min-h-screen md:justify-end" style={{
        backgroundImage: `url(${DSweetBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flex: 1
      }}>
      {/* Login Form with Wave Effect on Left */}
      <div className="relative w-full md:w-[60%] h-screen p-10 flex overflow-hidden">
        <div className='absolute top-8 left-36 text-left'>
            <p className='font-grand-hotel text-4xl md:text-8xl text-white line-clamp-1'>D’ Sweet Fix</p>
            <p className='text-white text-lg md:text-xl pl-8'>BAKING & CONFECTIONERY SHOP</p>
        </div>
        <div className="absolute bottom-12 left-2 md:left-36 w-full md:w-[60%] h-[65%] mx-auto p-8">
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout='vertical'
            className='w-full h-full'
          >
            <Form.Item
              name="Username"
              label={<p className='text-white text-2xl'>Username</p>}
              rules={[{ required: true, message: 'Please enter your username!' }]}
            >
              <Input placeholder="Enter your username" />
            </Form.Item>
            <Form.Item
              name="password"
              label={<p className='text-white text-2xl'>Password</p>}
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" loading={loading} className='bg-black w-full' htmlType="submit">
                Sign In
              </Button>
            </Form.Item>
            <p className='w-full text-center text-white'>© 2024</p>
          </Form>
        </div>
      </div>
    </div>
  );
};
