import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const Products = await AsyncStorage.getItem('@GoMarketplace:product');

      setProducts(JSON.parse(Products));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(p => p.id === product.id);

      const newProducts = productExists
        ? products.map(p =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
          )
        : [...products, { ...product, quantity: 1 }];

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products
          .map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          )
          .filter(product => product.quantity > 0),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
