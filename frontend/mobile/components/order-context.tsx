import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderState = {
  numberOfGuests: number;
  tableId?: string;
  items: OrderItem[];
};

type OrderContextValue = {
  state: OrderState;
  setGuests: (num: number) => void;
  setTable: (tableId: string) => void;
  addItem: (item: Omit<OrderItem, 'quantity'>) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  totalAmount: number;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>({ numberOfGuests: 0, items: [] });

  const setGuests = (num: number) => setState((s) => ({ ...s, numberOfGuests: Math.max(0, Math.floor(num)) }));
  const setTable = (tableId: string) => setState((s) => ({ ...s, tableId }));
  const addItem = (item: Omit<OrderItem, 'quantity'>) =>
    setState((s) => {
      const exist = s.items.find((x) => x.id === item.id);
      if (exist) {
        return { ...s, items: s.items.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x)) };
      }
      return { ...s, items: [...s.items, { ...item, quantity: 1 }] };
    });
  const updateItemQuantity = (itemId: string, quantity: number) =>
    setState((s) => ({
      ...s,
      items: s.items
        .map((x) => (x.id === itemId ? { ...x, quantity } : x))
        .filter((x) => x.quantity > 0),
    }));
  const removeItem = (itemId: string) => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== itemId) }));
  const clearOrder = () => setState({ numberOfGuests: 0, items: [], tableId: undefined });

  const totalAmount = useMemo(() => state.items.reduce((sum, x) => sum + x.price * x.quantity, 0), [state.items]);

  const value: OrderContextValue = useMemo(
    () => ({ state, setGuests, setTable, addItem, updateItemQuantity, removeItem, clearOrder, totalAmount }),
    [state]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}


