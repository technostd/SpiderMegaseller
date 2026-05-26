// frontend/src/components/Header.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // твоя логика выхода
    localStorage.removeItem('token'); // пример
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed w-full z-50">
      <div className="max-w-screen-2xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">

        {/* Левая часть */}
        <div className="flex items-center gap-3">
          {/* Кнопка меню — только на мобильных */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Логотип / Название */}
          <Link to="/lk" className="font-semibold text-xl text-gray-900">
            AI Reviews
          </Link>
        </div>

        {/* Правая часть — Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/lk"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <User className="w-4 h-4" />
            Личный кабинет
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>

        {/* Правая часть — Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            to="/lk"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <User className="w-5 h-5" />
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;