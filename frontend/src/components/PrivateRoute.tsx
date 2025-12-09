// src/components/PrivateRoute.tsx
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthProvider';

export default function PrivateRoute() {
    const {user, isLoading} = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{from: location.pathname}} replace/>;
    }

    return <Outlet/>;
}