// src/components/Header.tsx
import {Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthProvider';
import ButtonPrimary from "../shared/Button/ButtonPrimary.tsx";
import {Bug} from "lucide-react";
import HeaderLinkButton from "../shared/Button/HeaderLinkButton.tsx";

export default function Header() {
    const {user, logout} = useAuth();

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                {/* Логотип и навигация */}
                <div className="flex items-center space-x-6">
                    <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:opacity-80">
                        <Bug className="h-6 w-6 text-emerald-600"/> Паук
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6">
                        <HeaderLinkButton to={'/modules'}/>
                        <HeaderLinkButton to={'/instructions'}/>
                    </nav>
                </div>

                {/* Правая часть: кнопки */}
                <div className="flex items-center space-x-6">
                    {user ? (
                        <div>
                            <span className="text-sm text-gray-600 hidden md:inline">
                              {user.name || user.email}
                            </span>
                            <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-gray-800">
                                Разлогиниться
                            </button>
                            <ButtonPrimary to={"/lk"} text={"Личный кабинет"}/>
                        </div>
                    ) : (
                        <div>
                            <ButtonPrimary to={"/lk"} text={"Войти"}/>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );

}