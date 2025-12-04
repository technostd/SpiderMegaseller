// src/App.tsx
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Home from './pages/Home';
import Instructions from './pages/Instructions';
import AiReviewsPublic from './pages/AiReviewsPublic';
import AiReviewsTest from './pages/AiReviewsTest';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

// Приватные страницы
import Dashboard from './pages/lk/Dashboard';
import Integrations from './pages/lk/Integrations';
import AiReviewsModule from "./pages/lk/AiReviewsModule.tsx";
import ModuleSettings from "./pages/lk/ModuleSettings.tsx";
import Modules from "./pages/Modules.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Публичные */}
                <Route path="/" element={<Home/>}/>
                <Route path="/instructions" element={<Instructions/>}/>
                <Route path="/modules" element={<Modules />}/>
                <Route path="/module/ai-reviews" element={<AiReviewsPublic/>}/>
                <Route path="/module/ai-reviews/test" element={<AiReviewsTest/>}/>
                <Route path="/login" element={<Login/>}/>

                {/* Приватная зона */}
                <Route
                    path="/lk/*"
                    element={
                        <PrivateRoute/>
                    }
                >
                    <Route index element={<Dashboard/>}/>
                    <Route path="integrations" element={<Integrations/>}/>
                    <Route path="modules" element={<Dashboard/>}/>
                    <Route path="module/ai-reviews" element={<AiReviewsModule/>}/>
                    <Route path="module/:id/settings" element={<ModuleSettings/>}/>
                </Route>

                {/* Редиректы со старых путей */}
                <Route path="/dashboard" element={<Navigate to="/lk" replace/>}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}