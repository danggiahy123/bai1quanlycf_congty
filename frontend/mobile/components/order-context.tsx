import { createContext, ReactNode, useContext, useMemo, useState, useCallback } from 'react';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type BookingInfo = {
  date: string;
  time: string;
};

type SelectedTable = {
  id: string;
  name: string;
};

type OrderState = {
  numberOfGuests: number;
  selectedTable?: SelectedTable;
  items: OrderItem[];
  bookingInfo?: BookingInfo;
};

type OrderContextValue = {
  state: OrderState;
  setGuests: (num: number) => void;
  setTable: (table: SelectedTable) => void;
  setBookingInfo: (info: BookingInfo) => void;
  addItem: (item: Omit<OrderItem, 'quantity'>) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  totalAmount: number;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>({ numberOfGuests: 0, items: [] });

  const setGuests = useCallback((num: number) => setState((s) => ({ ...s, numberOfGuests: Math.max(0, Math.floor(num)) })), []);
  const setTable = useCallback((table: SelectedTable) => setState((s) => ({ ...s, selectedTable: table })), []);
  const setBookingInfo = useCallback((info: BookingInfo) => setState((s) => ({ ...s, bookingInfo: info })), []);
  const addItem = useCallback((item: Omit<OrderItem, 'quantity'>) =>
    setState((s) => {
      const exist = s.items.find((x) => x.id === item.id);
      if (exist) {
        return { ...s, items: s.items.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x)) };
      }
      return { ...s, items: [...s.items, { ...item, quantity: 1 }] };
    }), []);
  const updateItemQuantity = useCallback((itemId: string, quantity: number) =>
    setState((s) => ({
      ...s,
      items: s.items
        .map((x) => (x.id === itemId ? { ...x, quantity } : x))
        .filter((x) => x.quantity > 0),
    })), []);
  const removeItem = useCallback((itemId: string) => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== itemId) })), []);
  const clearOrder = useCallback(() => setState({ numberOfGuests: 0, items: [], selectedTable: undefined, bookingInfo: undefined }), []);

  const totalAmount = useMemo(() => state.items.reduce((sum, x) => sum + x.price * x.quantity, 0), [state.items]);

  const value: OrderContextValue = useMemo(
    () => ({ state, setGuests, setTable, setBookingInfo, addItem, updateItemQuantity, removeItem, clearOrder, totalAmount }),
    [state, setGuests, setTable, setBookingInfo, addItem, updateItemQuantity, removeItem, clearOrder, totalAmount]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}


