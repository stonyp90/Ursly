import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useUser } from '../contexts';
import { NotificationInbox } from './NotificationInbox';
import './Header.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/agents': 'Agents',
  '/models': 'Models',
  '/tasks': 'Tasks',
  '/connectors': 'Creative Connectors',
  '/audit': 'Audit Logs',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/permissions': 'Permissions',
  '/groups': 'Groups',
  '/users': 'Users',
  '/open-api': 'API Documentation',
  '/metrics': 'Metrics',
  '/metrics/gpu': 'Metrics',
  '/metrics/timeline': 'Metrics',
  '/metrics/system': 'Metrics',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { user, organizations, currentOrg, setCurrentOrg, createOrganization } = useUser();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
      setShowOrgMenu(false);
    }
    if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
      setShowUserMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Close menus on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowOrgMenu(false);
        setShowUserMenu(false);
        setShowCreateOrgModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  
  const title = pageTitles[location.pathname] || 'Agent Orchestrator';

  const handleLogout = () => {
    auth.signoutRedirect();
  };

  const handleNavigate = (path: string) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const handleCreateOrg = () => {
    if (newOrgName.trim()) {
      createOrganization(newOrgName.trim());
      setNewOrgName('');
      setShowCreateOrgModal(false);
      setShowOrgMenu(false);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">{title}</h2>
      </div>
      
      <div className="header-right">
        {/* Organization Switcher */}
        <div className="org-switcher" ref={orgMenuRef}>
          <button 
            className="org-switcher-btn"
            onClick={() => setShowOrgMenu(!showOrgMenu)}
          >
            <div className="org-avatar">
              {currentOrg?.logoUrl ? (
                <img src={currentOrg.logoUrl} alt={currentOrg.name} />
              ) : (
                <span>{currentOrg?.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="org-name">{currentOrg?.name}</span>
            <svg className="org-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          
          {showOrgMenu && (
            <div className="dropdown-menu org-menu">
              <div className="dropdown-header">Switch Organization</div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  className={`dropdown-item ${org.id === currentOrg?.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentOrg(org);
                    setShowOrgMenu(false);
                  }}
                >
                  <div className="org-item-avatar">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} />
                    ) : (
                      <span>{org.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="org-item-info">
                    <span className="org-item-name">{org.name}</span>
                    <span className="org-item-role">{org.role}</span>
                  </div>
                  {org.id === currentOrg?.id && (
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="dropdown-divider" />
              <button 
                className="dropdown-item create-org"
                onClick={() => {
                  setShowOrgMenu(false);
                  setShowCreateOrgModal(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create Organization</span>
              </button>
            </div>
          )}
          
          {/* Create Org Modal */}
          {showCreateOrgModal && (
            <div className="modal-overlay" onClick={() => setShowCreateOrgModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Create Organization</h3>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder="Organization name"
                  className="modal-input"
                  autoFocus
                />
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowCreateOrgModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleCreateOrg}>
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Inbox */}
        <NotificationInbox />

        {/* User Profile */}
        <div className="user-profile" ref={userMenuRef}>
          <button 
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} />
              ) : (
                <span>{user?.initials || '?'}</span>
              )}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="dropdown-menu user-menu">
              <div className="user-info">
                <div className="user-avatar-large">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} />
                  ) : (
                    <span>{user?.initials || '?'}</span>
                  )}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.fullName || 'User'}</span>
                  <span className="user-email">{user?.email || 'No email'}</span>
                  <span className="user-username">@{user?.username || 'unknown'}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => handleNavigate('/profile')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>My Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => handleNavigate('/settings')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </button>
              <button className="dropdown-item" onClick={() => handleNavigate('/open-api')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>API Docs</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
