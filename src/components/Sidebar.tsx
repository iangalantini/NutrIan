import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-header flex-between">
        <h1 className="logo-text">Nutr<span>Ian</span></h1>
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Alternar tema">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/pacientes" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <Users size={20} />
          <span>Pacientes</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={() => signOut()} className="btn-logout-sidebar">
          <LogOut size={20} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
