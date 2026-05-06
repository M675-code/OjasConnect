import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Events from './pages/Events';           
import AdminPanel from './pages/AdminPanel';   
import AdminEditUser from './pages/AdminEditUser';
import Sidebar from './components/Sidebar'; 
import NetworkBackground from './components/NetworkBackground'; 
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './App.css';

// --- PROMOTIONS SLIDER COMPONENT ---
const PromoSlider = () => {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();
    
    const promos = [
        { id: 1, title: "Doe Tech Solutions", desc: "Web & Mobile App Development", img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" },
        { id: 2, title: "Jain Jewelers", desc: "Exclusive Gold & Diamond Collection", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80" },
    ];

    // FIX: 3-Second Auto Scroll
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === promos.length - 1 ? 0 : prev + 1));
        }, 15000);
        return () => clearInterval(timer);
    }, [promos.length]);

    const nextSlide = () => setCurrent(current === promos.length - 1 ? 0 : current + 1);
    const prevSlide = () => setCurrent(current === 0 ? promos.length - 1 : current - 1);

    return (
        <div className="promo-slider-container">
            <div className="promo-slide" style={{ backgroundImage: `url(${promos[current].img})` }}>
                <div className="promo-overlay"></div>
                <div className="promo-content">
                    <span className="promo-badge">#Spotlight</span>
                    <h2>{promos[current].title}</h2>
                    <p>{promos[current].desc}</p>
                    {/* FIX: Added onClick to actually redirect the user when clicked */}
                    <button className="promo-action-btn" onClick={() => navigate('/directory')}>
                        View Details
                    </button>
                </div>
                
                <div className="promo-controls">
                    <button className="promo-btn" onClick={prevSlide}><ChevronLeft size={24}/></button>
                    <button className="promo-btn" onClick={nextSlide}><ChevronRight size={24}/></button>
                </div>
            </div>
        </div>
    );
};

const ProtectedApp = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    // UPDATE: Redirects to /login by default unless AuthContext provides a valid session
    if (!user) return <Navigate to="/login" replace />;

    // Construct the name safely for the greeting
    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Member';

    return (
        <div className="app-container">
            <Sidebar />
            
            {/* FIX: Added pointerEvents: 'none' so this background can NEVER block clicks again */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
                <NetworkBackground />
            </div>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={
                        <div className="dashboard-wrapper">
                            {/* The Logo Header */}
                            <header className="dashboard-top-bar">
                                <img src="/logo.png" alt="Ojas Logo" />
                            </header>

                            {/* The Hero Content */}
                            <div className="dashboard-hero">
                                <div className="fade-text-container">
                                    <h1>Welcome back, {displayName}!</h1>
                                    <p>Select an option from the menu to get started.</p>
                                </div>

                                <PromoSlider />
                            </div>
                        </div>
                    } />

                    <Route path="/directory" element={<div className="page-padding"><Directory /></div>} />
                    <Route path="/user/:id" element={<div className="page-padding"><Profile /></div>} />
                    <Route path="/profile" element={<div className="page-padding"><Profile /></div>} />
                    <Route path="/events" element={<div className="page-padding"><Events /></div>} /> 
                    
                    <Route path="/admin" element={
                        user.role === 'admin' 
                            ? <div className="page-padding"><AdminPanel /></div> 
                            : <Navigate to="/" />
                    } />
                    <Route path="/admin/users/:id" element={
                        user.role === 'admin'
                            ? <div className="page-padding"><AdminEditUser /></div>
                            : <Navigate to="/" />
                    } />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={<ProtectedApp />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}