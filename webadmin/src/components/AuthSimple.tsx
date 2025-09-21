import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://192.168.1.161:5000';

type Employee = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
};

type AuthProps = {
  onLogin: (employee: Employee, token: string) => void;
};

export default function AuthSimple({ onLogin }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate input
    if (!form.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      setLoading(false);
      return;
    }

    if (!form.password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login with:', { username: form.username, password: '***' });
      console.log('🌐 API URL:', API);
      
      const response = await axios.post(`${API}/api/employees/login`, {
        username: form.username.trim(),
        password: form.password
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login response:', response.data);
      
      if (response.data && response.data.token && response.data.employee) {
        // Chỉ cho phép tài khoản admin đăng nhập webadmin
        if (response.data.employee.role !== 'admin') {
          setError('Chỉ tài khoản quản lý mới có thể đăng nhập webadmin. Tài khoản nhân viên vui lòng sử dụng ứng dụng mobile.');
          return;
        }
        setSuccess('Đăng nhập thành công!');
        onLogin(response.data.employee, response.data.token);
      } else {
        setError('Dữ liệu phản hồi không hợp lệ');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      if (err.code === 'ECONNREFUSED') {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Kết nối bị timeout. Vui lòng thử lại.');
      } else if (err.response?.status === 401) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (err.response?.status === 400) {
        setError('Thông tin đăng nhập không hợp lệ');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quản lý hệ thống quán cà phê
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập (vd: td123)"
                value={form.username}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu (vd: 123456)"
                value={form.password}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium">Lỗi đăng nhập</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium">Thành công</p>
                  <p>{success}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Tài khoản quản lý: <span className="font-mono bg-gray-100 px-2 py-1 rounded">admin</span> / <span className="font-mono bg-gray-100 px-2 py-1 rounded">admin123</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ Chỉ tài khoản quản lý mới có thể đăng nhập webadmin<br/>
              Tài khoản nhân viên vui lòng sử dụng ứng dụng mobile
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
