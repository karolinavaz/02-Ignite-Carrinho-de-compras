import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface ProductCart extends Product {
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  async function getProductId(productId: number) {
    let response = await api.get(`products/${productId}`)
      .then(response => {
        return response?.data
      })

    return response
  }

  async function getStockId(productId: number) {
    let response = await api.get(`stock/${productId}`)
      .then(response => {
        return response?.data
      })

    return response
  }

  const [cart, setCart] = useState<ProductCart[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let productStock: Stock = await getStockId(productId)
      let product: Product = await getProductId(productId)
      let hasProduct = cart?.filter(product => product?.id === productId)

      if ((hasProduct?.length === 0 && productStock.amount > 1) || (hasProduct?.length > 0 && productStock.amount > hasProduct?.[0]?.amount))
        if (hasProduct?.length === 0) {
          setCart([...cart, { ...product, amount: 1 }])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]))
        }
        else {
          let newCart = cart?.map(item => {
            if (item?.id === productId) {
              return { ...item, amount: item?.amount + 1 }
            }
            else
              return item
          })

          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }
      else
        toast.error('Quantidade solicitada fora de estoque');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let hasProduct = cart?.filter(product => product?.id === productId)?.length > 0
      if (hasProduct) {
        let newCart = cart.filter(item => item?.id !== productId)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
      else {
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        let productStock: Stock = await getStockId(productId)

        if (productStock.amount >= amount) {
          let newCart = cart?.map(item => {
            if (item?.id === productId) {
              return { ...item, amount: amount }
            }
            else
              return item
          })
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }
        else
          toast.error('Quantidade solicitada fora de estoque');
      }
      else {
        return
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
