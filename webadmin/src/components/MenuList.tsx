import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Ingredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  isAvailable: boolean;
  ingredients?: Ingredient[];
}

interface MenuListProps {
  API: string;
  token: string;
}

const MenuList: React.FC<MenuListProps> = ({ API, token }) => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, [searchTerm, selectedCategory, currentPage]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await axios.get(`${API}/api/menu?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMenus(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/api/menu/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMenus();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Danh sách món ăn</h1>
        <p className="text-gray-600">Quản lý menu và món ăn</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Category Filter */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {menus.map((menu) => (
          <div key={menu._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            {menu.image ? (
              <img
                src={menu.image}
                alt={menu.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{menu.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  menu.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {menu.isAvailable ? 'Có sẵn' : 'Hết hàng'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{menu.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{menu.category}</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(menu.price)}</span>
              </div>

              {menu.ingredients && menu.ingredients.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Nguyên liệu:</p>
                  <div className="flex flex-wrap gap-1">
                    {menu.ingredients.slice(0, 3).map((ingredient, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {ingredient.ingredientName}
                      </span>
                    ))}
                    {menu.ingredients.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{menu.ingredients.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  Chỉnh sửa
                </button>
                <button className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 text-center text-gray-500">
        Hiển thị {menus.length} trong tổng số {totalItems} món ăn
      </div>
    </div>
  );
};

export default MenuList;
