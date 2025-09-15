import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

type Menu = {
  _id: string;
  name: string;
  price: number;
  image?: string;
  note?: string;
  size?: string[];
  available?: boolean;
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm: Omit<Menu, '_id'> = {
  name: '',
  price: 0,
  image: '',
  note: '',
  size: ['M'],
  available: true,
};

export default function App() {
  const [items, setItems] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Menu, '_id'>>(emptyForm);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((x) => `${x.name} ${x.note ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<Menu[]>(`${API}/api/menu`);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(row: Menu) {
    setEditingId(row._id);
    setForm({
      name: row.name,
      price: row.price,
      image: row.image || '',
      note: row.note || '',
      size: row.size && row.size.length ? row.size : ['M'],
      available: row.available ?? true,
    });
    setOpen(true);
  }

  async function save() {
    if (editingId) {
      await axios.put(`${API}/api/menu/${editingId}`, form);
    } else {
      await axios.post(`${API}/api/menu`, form);
    }
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Xóa món này?')) return;
    await axios.delete(`${API}/api/menu/${id}`);
    await load();
  }

  const toggleSize = (size: 'S' | 'M' | 'L') => {
    const set = new Set(form.size ?? []);
    set.has(size) ? set.delete(size) : set.add(size);
    setForm((prev) => ({ ...prev, size: Array.from(set) as string[] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <h1 className="text-xl font-semibold">Admin Menu</h1>
          <input
            placeholder="Tìm theo tên/ghi chú..."
            className="ml-auto w-72 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" /> Thêm món
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div key={m._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-40 bg-gray-100">
                  {m.image ? (
                    <img
                      src={m.image.startsWith('http') ? m.image : `${API}${m.image}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-black">
                      {m.name}
                      {m.size && m.size.length ? ` • ${m.size.join('/')}` : ''}
                    </div>
                    <div className="text-blue-600 font-semibold">{m.price.toLocaleString()}đ</div>
                  </div>
                  {m.note && <div className="text-sm text-gray-600">{m.note}</div>}
                  <div className="flex items-center justify-between pt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${m.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {m.available ? 'Đang bán' : 'Tạm ngừng'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(m)} className="p-2 rounded hover:bg-gray-100">
                        <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      <button onClick={() => remove(m._id)} className="p-2 rounded hover:bg-gray-100">
                        <TrashIcon className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && <div className="text-gray-500">Không có món nào.</div>}
          </div>
        )}
      </main>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">{editingId ? 'Sửa món' : 'Thêm món'}</Dialog.Title>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm">Tên món</label>
                <input
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm">Giá (đ)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm">Trạng thái</label>
                <select
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={form.available ? '1' : '0'}
                  onChange={(e) => setForm((f) => ({ ...f, available: e.target.value === '1' }))}
                >
                  <option value="1">Đang bán</option>
                  <option value="0">Tạm ngừng</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm">Link ảnh</label>
                <input
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://... hoặc /uploads/xxx.jpg"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Ghi chú</label>
                <textarea
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Size</label>
                <div className="mt-2 flex gap-2">
                  {(['S', 'M', 'L'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-3 py-1 rounded border ${
                        form.size?.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">
                Hủy
              </button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}


