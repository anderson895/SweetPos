import { useEffect, useState } from "react";
import {
  Product,
  Category,
} from "../../../../types";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getFirestore,
  getDocs,
} from "firebase/firestore";
import { message, TabsProps } from "antd";

export default function usePos() {
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

  // Fetch products and categories with real-time updates
  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const productsRef = collection(db, "products");
        const categoriesRef = collection(db, "categories");

        // Real-time updates for products
        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
          const productsList: Product[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          productsList.shift()
          setProducts(productsList);
        });

        // Fetch categories (no real-time needed unless required)
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesList: Category[] = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        categoriesList.shift()
        setCategories(categoriesList);

        return () => {
          unsubscribeProducts(); // Cleanup real-time listener
        };
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        message.error("Failed to load inventory data.");
      }
    };

    fetchProductsAndCategories();
  }, [db]);

  // Real-time clock for current date and time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Categories mapped for tabs
  const categoryList = categories.map((item: Category) => ({
    key: item.id.toString(),
    label: item.name,
  }));
  const items: TabsProps["items"] = [
    { key: "", label: "All" },
    ...categoryList,
  ];

  // Handle category selection
  const handleCategoryChange = (value: string) => setSelectedCategory(value);

  // Add product to cart
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

  // Handle quantity change in cart
  const handleQuantityChange = (productId: string, quantity: number | null) => {
    if (quantity === null || quantity < 1) {
      handleRemoveFromCart(productId);
    } else {
      const updatedCart = cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
    }
  };

  // Remove product from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Calculate subtotal and grand total
  const calculateTotal = () => {
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

  // Handle payment amount change
  const handlePaymentAmountChange = (value: number | null) => {
    setPaymentAmount(value);
    setChange(value !== null && value >= grandTotal ? value - grandTotal : null);
  };

  // Process order submission
  const handleOrderSubmission = async () => {
    if (paymentAmount === null || paymentAmount < grandTotal) {
      message.error("Insufficient payment amount.");
      return;
    }

    setLoading(true);

    try {
      const insufficientStockItems: string[] = [];
      for (const item of cart) {
        const productRef = doc(db, "products", item.product.id);
        const productSnapshot = await getDoc(productRef);

        if (productSnapshot.exists()) {
          const productData = productSnapshot.data();
          if (item.quantity > productData.stock) {
            insufficientStockItems.push(item.product.name);
          }
        } else {
          message.error(`Product ${item.product.name} not found.`);
          setLoading(false);
          return;
        }
      }

      if (insufficientStockItems.length > 0) {
        message.error(
          `Insufficient stock for the following items: ${insufficientStockItems.join(
            ", "
          )}`
        );
        setLoading(false);
        return;
      }

      const orderData = {
        cartItems: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          category: categories.find((cat) => cat.id === item.product.category)
            ?.name,
          total: item.quantity * item.product.price,
        })),
        subtotal,
        grandTotal,
        paymentAmount,
        change,
        paymentMethod,
        timestamp: serverTimestamp(),
      };

      const ordersCollectionRef = collection(db, "orders");
      await addDoc(ordersCollectionRef, orderData);

      for (const item of cart) {
        const productRef = doc(db, "products", item.product.id);
        const productSnapshot = await getDoc(productRef);
      
        if (productSnapshot.exists()) {
          const productData = productSnapshot.data();
          const currentStock = Number(productData.stock); 
          const updatedStock = currentStock - item.quantity;
      
          if (updatedStock < 0) {
            throw new Error(
              `Not enough stock for ${item.product.name}. Current stock: ${currentStock}`
            );
          }
    
          await updateDoc(productRef, {
            stock: updatedStock.toString(),
          });
        } else {
          throw new Error(`Product ${item.product.name} not found in inventory.`);
        }
      }
      

      setCart([]);
      setPaymentAmount(null);
      setChange(null);
      message.success("Order processed successfully!");
    } catch (error) {
      console.error("Error processing order:", error);
      message.error("Failed to process the order.");
    } finally {
      setLoading(false);
    }
  };

  return {
    handleAddToCart,
    handleCategoryChange,
    handleOrderSubmission,
    handlePaymentAmountChange,
    handleQuantityChange,
    handleRemoveFromCart,
    setPaymentMethod,
    items,
    currentDateTime,
    loading,
    selectedCategory,
    products,
    cart,
    subtotal,
    grandTotal,
    paymentAmount,
    paymentMethod,
    change,
  };
}
