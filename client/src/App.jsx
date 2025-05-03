// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage'; 
import LoginPage from './pages/LoginPage';
import UpgradePage from './pages/UpgradePage';
import './styles/App.css';
import { NavLink } from 'react-router-dom';

function App() {
  return (
    <Router>
      <nav>
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
          Inventory
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => isActive ? 'active' : ''}>
          Sales
        </NavLink>
        <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
          Login
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/sales" element={<SalesPage />} /> {/* New Route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
      </Routes>
    </Router>
  );
}

export default App;