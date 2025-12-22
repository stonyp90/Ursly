import { Inbox } from '@novu/react';
import { useAuth } from 'react-oidc-context';
import './NotificationInbox.css';

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function NotificationInbox() {
  const auth = useAuth();
  const applicationIdentifier =
    import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER || 'FNfEAbhmW05j';

  // Don't render if user isn't authenticated
  if (!auth.user?.profile?.sub) {
    return (
      <div className="notification-inbox-wrapper">
        <button className="notification-bell-fallback" title="Notifications">
          <BellIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="notification-inbox-wrapper">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={auth.user.profile.sub}
        appearance={{
          baseTheme: {
            variables: {
              colorPrimary: '#6366f1',
              colorPrimaryForeground: '#ffffff',
              colorSecondary: '#8b5cf6',
              colorSecondaryForeground: '#ffffff',
              colorCounter: '#ef4444',
              colorCounterForeground: '#ffffff',
              colorBackground: '#12121a',
              colorForeground: '#f1f5f9',
              colorNeutral: 'rgba(255, 255, 255, 0.08)',
              colorShadow: 'rgba(0, 0, 0, 0.5)',
              colorRing: '#6366f1',
              fontSize: '14px',
            },
          },
          elements: {
            bellIcon: {
              color: '#94a3b8',
              width: '20px',
              height: '20px',
            },
            bellContainer: {
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid transparent',
              transition: 'all 0.15s ease',
            },
            popoverContent: {
              backgroundColor: '#16161e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03)',
              width: '380px',
              maxHeight: '500px',
            },
            popoverHeader: {
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '16px 20px',
            },
            popoverHeaderTitle: {
              color: '#f1f5f9',
              fontSize: '15px',
              fontWeight: '600',
            },
            notificationItem: {
              backgroundColor: 'transparent',
              borderRadius: '8px',
              margin: '4px 8px',
              padding: '12px 14px',
              transition: 'all 0.15s ease',
            },
            notificationItemContent: {
              color: '#f1f5f9',
              fontSize: '13px',
              lineHeight: '1.5',
            },
            notificationItemTimestamp: {
              color: '#64748b',
              fontSize: '11px',
            },
            notificationDot: {
              backgroundColor: '#6366f1',
              boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
            },
            notificationItemUnread: {
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderLeft: '2px solid #6366f1',
            },
            emptyNotificationList: {
              color: '#64748b',
              padding: '40px 20px',
            },
            preferences: {
              backgroundColor: '#16161e',
            },
            preferencesItem: {
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        }}
        placement="bottom-end"
        placementOffset={8}
      />
    </div>
  );
}
