/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Form, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, serverTimestamp, collection, where, query, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

export const CreateStaffPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined
  );
  const storage = getStorage();
  const db = getFirestore();
  const auth = getAuth(); // Initialize Firebase Authentication

  const checkIfEmailExists = async (email: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const emailExists = await checkIfEmailExists(values.email);
  
      if (emailExists) {
        setLoading(false);
        message.error("Email is already in use. Please choose another one.");
        return;
      }
  
      let profilePictureUrl = "";
      if (values.profilePicture && values.profilePicture.originFileObj) {
        const file = values.profilePicture.originFileObj as RcFile;
        const storageRef = ref(
          storage,
          `profilePictures/${uuidv4()}-${file.name}`
        );
        await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(storageRef);
      }
  
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
  
      // Save staff data to Firestore
      const userId = userCredential.user.uid; // Use the user ID from Firebase Authentication
      await setDoc(doc(db, "users", userId), {
        username: values.username,
        email: values.email,
        firstname: values.firstname,
        lastname: values.lastname,
        profilePicture: profilePictureUrl,
        status:'Active',
        type:'staff',
        createdAt: serverTimestamp(),
        providerId: "email", // Specify that the provider is email
      });
  
      setLoading(false);
      message.success("Staff created successfully!");
      form.resetFields(); // Reset the form fields
      setPreviewImage(undefined); // Reset image preview
    } catch (error:any) {
      console.error("Error adding staff: ", error);
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        message.error("Email is already associated with an account. Please use a different email.");
      } else {
        message.error("Failed to create staff.");
      }
    }
  };
  
  const handleImagePreview = (file: RcFile) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setPreviewImage(reader.result as string);
  };

  const handleImageChange = (info: any) => {
    if (info.fileList[0].originFileObj) {
      handleImagePreview(info.fileList[0].originFileObj);
    }
  };

  return (
    <div className="flex justify-center items-center flex-col h-full">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="w-[80%] p-4 px-12 rounded-lg shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
      >
        <div className="w-full flex justify-center items-center">
          <Form.Item
            label="Profile Picture"
            name="profilePicture"
            valuePropName="file"
            getValueFromEvent={(e) => e && e.fileList[0]}
          >
            {previewImage && (
              <img
                src={previewImage}
                alt="Profile Preview"
                className="w-[150px] h-[150px] rounded-full shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]"
              />
            )}
            <Upload
              beforeUpload={() => false}
              onChange={handleImageChange}
              showUploadList={false}
              maxCount={1}
            >
              <Button className="my-4" icon={<UploadOutlined />}>
                Click to Upload
              </Button>
            </Upload>
          </Form.Item>
        </div>

        <div className="flex gap-4 w-full flex-nowrap">
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter a username" }]}
            className="flex-1"
          >
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
            className="flex-1"
          >
            <Input placeholder="Email" />
          </Form.Item>
        </div>

        <div className="flex gap-4 w-full flex-nowrap">
          <Form.Item
            label="First Name"
            name="firstname"
            rules={[{ required: true, message: "Please enter the first name" }]}
            className="flex-1"
          >
            <Input placeholder="First Name" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastname"
            rules={[{ required: true, message: "Please enter the last name" }]}
            className="flex-1"
          >
            <Input placeholder="Last Name" />
          </Form.Item>
        </div>

        <div className="flex gap-4 w-full flex-nowrap">
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter a password" },
              {
                min: 6,
                message: "Password must be at least 6 characters long",
              },
            ]}
            className="flex-1"
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            className="flex-1"
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>
        </div>

        <Form.Item className="w-full flex justify-center items-center">
          <Button
            loading={loading}
            type="primary"
            className="w-40 text-xl h-max bg-black"
            htmlType="submit"
          >
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
