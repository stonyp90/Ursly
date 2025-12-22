import { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';
import { env } from '../config/env';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
  logoUrl?: string;
}

interface UserContextType {
  user: UserProfile | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  createOrganization: (name: string) => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'username'>>) => Promise<void>;
  /** Key that changes when org switches - use as useEffect dependency for auto-refresh */
  refreshKey: number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'ursly_current_org';

// Mock organizations for demo - in production, fetch from API
const getInitialOrganizations = (): Organization[] => [
  { id: 'org-1', name: 'Ursly.io', slug: 'ursly', role: 'owner', logoUrl: undefined },
  { id: 'org-2', name: 'CREE8 Studios', slug: 'cree8', role: 'admin', logoUrl: undefined },
  { id: 'org-3', name: 'Acme Corp', slug: 'acme', role: 'member', logoUrl: undefined },
];

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>(getInitialOrganizations);
  const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || 'org-1';
  });
  const [localProfileOverrides, setLocalProfileOverrides] = useState<Partial<UserProfile>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  const user = useMemo<UserProfile | null>(() => {
    if (!auth.user?.profile) return null;
    
    const profile = auth.user.profile;
    const firstName = localProfileOverrides.firstName || (profile.given_name as string) || '';
    const lastName = localProfileOverrides.lastName || (profile.family_name as string) || '';
    const email = (profile.email as string) || '';
    const username = localProfileOverrides.username || (profile.preferred_username as string) || email.split('@')[0];
    
    return {
      id: (profile.sub as string) || '',
      email,
      username,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim() || username,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || username.charAt(0).toUpperCase(),
      avatarUrl: profile.picture as string | undefined,
    };
  }, [auth.user?.profile, localProfileOverrides]);

  const currentOrg = useMemo(() => {
    return organizations.find(org => org.id === currentOrgId) || organizations[0];
  }, [organizations, currentOrgId]);

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgId(org.id);
    localStorage.setItem(STORAGE_KEY, org.id);
    setRefreshKey(k => k + 1); // Trigger refresh on org change
  }, []);

  const createOrganization = useCallback((name: string) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      role: 'owner',
      logoUrl: undefined,
    };
    setOrganizations(prev => [...prev, newOrg]);
    setCurrentOrg(newOrg);
  }, [setCurrentOrg]);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'username'>>) => {
    // In production, this would call Keycloak Admin API or your backend
    // For now, we store locally
    setLocalProfileOverrides(prev => ({
      ...prev,
      ...updates,
    }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  // Load profile overrides from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ursly_profile_overrides');
    if (stored) {
      try {
        setLocalProfileOverrides(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Persist profile overrides
  useEffect(() => {
    if (Object.keys(localProfileOverrides).length > 0) {
      localStorage.setItem('ursly_profile_overrides', JSON.stringify(localProfileOverrides));
    }
  }, [localProfileOverrides]);

  // Sync user as Novu subscriber for notifications
  const hasSubscriberSynced = useRef(false);
  useEffect(() => {
    if (user && !hasSubscriberSynced.current) {
      hasSubscriberSynced.current = true;
      
      // Sync subscriber in background - don't block user experience
      fetch(env.api.endpoint('/auth/sync-subscriber'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user?.access_token}`,
        },
        body: JSON.stringify({
          subscriberId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatarUrl,
        }),
      }).catch((error) => {
        console.warn('Failed to sync notification subscriber:', error);
      });
    }
  }, [user, auth.user?.access_token]);

  // Bootstrap entitlements for the current organization on first load
  const hasBootstrapped = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (user && currentOrg && auth.user?.access_token && !hasBootstrapped.current.has(currentOrg.id)) {
      hasBootstrapped.current.add(currentOrg.id);
      
      // Call bootstrap endpoint to provision user with admin access and seed groups for this org
      fetch(env.api.endpoint('/entitlements/authorize/bootstrap'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user?.access_token}`,
          'X-Organization-Id': currentOrg.id,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Entitlements bootstrapped for org:', currentOrg.id, data);
          // Trigger refresh to reload data with new permissions
          setRefreshKey((k) => k + 1);
        })
        .catch((error) => {
          console.warn('Failed to bootstrap entitlements:', error);
        });
    }
  }, [user, currentOrg, auth.user?.access_token]);

  return (
    <UserContext.Provider
      value={{
        user,
        organizations,
        currentOrg,
        setCurrentOrg,
        createOrganization,
        isLoading: auth.isLoading,
        updateProfile,
        refreshKey,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
