import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from "./contexts/AuthProvider";

import Home from './pages/Home';
import Instructions from './pages/Instructions';
import AiReviewsPublic from './pages/AiReviewsPublic';
import AiReviewsTest from './pages/AiReviewsTest';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

import Dashboard from './pages/lk/Dashboard';
import Integrations from './pages/lk/Integrations';
import AiReviewsModule from "./pages/lk/AiReviewsModule";
import ModuleSettings from "./pages/lk/ModuleSettings";
import Modules from "./pages/Modules";
import TestContext from "./TestContext.tsx";
import {NotificationProvider} from "./contexts/NotificationContext.tsx";
import MarketplaceSettings from "./pages/lk/MarketplaceSettings.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <NotificationProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/test-context" element={<TestContext/>}/>

                        <Route path="/" element={<Home/>}/>
                        <Route path="/instructions" element={<Instructions/>}/>
                        <Route path="/modules" element={<Modules/>}/>
                        <Route path="/module/ai-reviews" element={<AiReviewsPublic/>}/>
                        <Route path="/module/ai-reviews/test" element={<AiReviewsTest/>}/>
                        <Route path="/login" element={<Login/>}/>

                        <Route
                            path="/lk/*"
                            element={
                                <PrivateRoute/>
                            }
                        >
                            <Route index element={<Dashboard/>}/>
                            <Route path="integrations/:marketplaceId" element={<MarketplaceSettings />} />
                            <Route path="integrations" element={<Integrations/>}/>
                            <Route path="modules" element={<Dashboard/>}/>
                            <Route path="module/ai-reviews" element={<AiReviewsModule/>}/>
                            <Route path="module/:id/settings" element={<ModuleSettings/>}/>
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace/>}/>

                    </Routes>
                </AuthProvider>
            </NotificationProvider>
        </BrowserRouter>
    );
}