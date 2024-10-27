/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Product, Category } from '../../../../types';
import { Button, Divider, InputNumber, message, Select, Tabs, TabsProps } from 'antd';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { currencyFormat } from '../../../../utils/utils';

export const PointofSalePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<
    { product: Product; quantity: number; img: string }[]
  >([]);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

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

        setProducts(productsWithCategory.slice(1));
        setCategories(categoriesList.slice(1));
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        message.error('Failed to load inventory data');
      }
    };

    fetchInventoryData();
  }, [db]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleString());
    };

    // Update date and time every second
    const intervalId = setInterval(updateDateTime, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const categoryList = categories?.map((item: Category) => ({
    key: item.id.toString(),
    label: item.name,
  }));
  const items: TabsProps["items"] = [
    { key: "", label: "All" },
    ...categoryList,
  ];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleAddToCart = (product: Product) => {
    const existingProductIndex = cart.findIndex(
      (item) => item.product.id === product.id
    );
    if (existingProductIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        { product, quantity: 1, img: product.image },
      ]);
    }
  };

  const handleQuantityChange = (productId: any, quantity: number | null) => {
    if (quantity === null || quantity < 1) {
      handleRemoveFromCart(productId);
    } else {
      const updatedCart = cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
    }
  };

  const handleRemoveFromCart = (productId: any) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = (): {
    subtotal: number;
    grandTotal: number;
  } => {
    return cart.reduce(
      (totals, item) => {
        const unitPrice = Number(item.product.price);
        const subtotal = unitPrice * item.quantity;
        totals.subtotal += subtotal;
        totals.grandTotal += subtotal;
        return totals;
      },
      { subtotal: 0, grandTotal: 0 }
    );
  };

  const { subtotal, grandTotal } = calculateTotal();

  const handlePaymentAmountChange = (value: number | null) => {
    setPaymentAmount(value);
    if (value !== null && value >= grandTotal) {
      setChange(value - grandTotal);
    } else {
      setChange(null);
    }
  };

  const handleOrderSubmission = async () => {
    if (paymentAmount === null || paymentAmount < grandTotal) {
        message.error('Insufficient payment amount.');
        return;
      }
    
      setLoading(true);
    
      try {
        // Prepare the order data
        const orderData = {
          cartItems: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            category: categories?.find((v:Category) => v.id === item.product.category)?.name,
            total: item.quantity * item.product.price,
          })),
          subtotal,
          grandTotal,
          paymentAmount,
          change,
          paymentMethod,
          timestamp: serverTimestamp(), // To track when the order was made
        };
    
        // Save the order to Firestore
        const ordersCollectionRef = collection(db, 'orders');
        await addDoc(ordersCollectionRef, orderData);
    
        // Optionally, you can clear the cart and reset the payment fields
        setCart([]);
        setPaymentAmount(null);
        setChange(null);
        message.success('Order processed successfully!');
    
      } catch (error) {
        console.error('Error processing order:', error);
        message.error('Failed to process the order.');
      } finally {
        setLoading(false);
      }
  };
console.log(change)
  return (
    <div className="min-h-screen p-4">
      <div className='flex justify-between items-center '>
      <h2 className="text-3xl">Point of Sale</h2>
      <p>{currentDateTime}</p>
      </div>

      <Divider className="my-4" />
      <div className="w-full flex gap-2 flex-nowrap">
        <div className="flex-1 h-max">
          <Tabs
            type="card"
            defaultActiveKey="0"
            items={items}
            onChange={handleCategoryChange}
          />
          <div className="items-stretch flex flex-wrap gap-4 overflow-y-auto p-2">
            {products
              .filter(
                (p) =>
                  !selectedCategory ||
                  p.category.toString() === selectedCategory
              )
              .map((product) => (
                <div key={product.id}>
                  <div
                    className={`${
                      cart?.find(
                        (v: any) => v.product.id === product.id
                      ) ? "border-2 border-sky-600 bg-sky-500 text-white" : "border-2 border-gray-300 bg-gray-300 text-white"
                    } transition ease-in-out duration-300 shadow-md flex-grow basis-[250px] max-w-max rounded-lg p-2 h-[120px] cursor-pointer`}
                    onClick={() => handleAddToCart(product)}
                  >
                    <img
                      className="w-[100px] h-[100px] rounded-full"
                      src={product.image}
                      alt=""
                    />
                  </div>
                  <p className="w-full text-center font-bold">{product.name}</p>
                  <p className="w-full text-center">
                    {currencyFormat(product.price)}
                  </p>
                </div>
              ))}
          </div>
        </div>
        <div className="w-[500px] border-l-2 pl-2 min-h-screen">
          <h3 className="text-xl font-semibold mb-4">Cart</h3>
          {cart.map((item) => {
            return (
              <div className="mb-4" key={item.product.id}>
                <div
                  className="cart-item flex items-stretch justify-between flex-wrap md:flex-nowrap"
                >
                  <div className="flex gap-2 basis-[50%]">
                    <img src={item.img} className="w-[50px] h-[50px]" alt="" />
                    <span className="font-medium break-words">
                      {item.product.name}
                    </span>
                  </div>
                  <div className="flex-grow flex items-stretch">
                    <Button
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          item.quantity - 1
                        )
                      }
                    >
                      -
                    </Button>
                    <InputNumber
                      value={item.quantity}
                      className="w-16 border-none"
                      onChange={(value) =>
                        handleQuantityChange(item.product.id, value)
                      }
                    />
                    <Button
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </Button>
                    <span className="font-semibold ml-4 flex-grow text-right">
                      {currencyFormat(
                        Number(item.product.price) * item.quantity
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <Divider className="my-4" />
          <div className="cart-summary">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Subtotal:</span>
              <span>{currencyFormat(subtotal)}</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between mb-4">
              <span className="text-lg font-semibold">Grand Total:</span>
              <span className="text-lg font-semibold">
                {currencyFormat(grandTotal)}
              </span>
            </div>
            <div className="payment-method mb-4 flex flex-nowrap gap-2 items-center">
              <h4 className="text-md font-semibold mb-2">Payment Method :</h4>
              <Select
              className="flex-1"
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value)}
              >
                <Select.Option value="Cash">Cash</Select.Option>
                <Select.Option value="GCash">GCash</Select.Option>
                <Select.Option value="Credit Card">Credit Card</Select.Option>
              </Select>
            </div>
            <div className="payment-amount mb-4 flex flex-nowrap gap-2 items-center">
              <h4 className="text-md font-semibold mb-2">Customer Payment:</h4>
              <InputNumber
                className="flex-1"
                value={paymentAmount}
                onChange={handlePaymentAmountChange}
                placeholder="Enter payment amount"
              />
            </div>
            <div className="mb-4 flex flex-nowrap gap-2 items-center">
              <h4 className="text-md font-semibold mb-2">Customer Change:</h4>
              <InputNumber className='flex-1' value={change} />
            </div>

            <Button
              type="primary"
              block
              size="large"
              className="mt-4"
              onClick={handleOrderSubmission}
              loading={loading}
            >
              Process Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
