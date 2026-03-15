import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const auth = localStorage.getItem('seo_auth');
  if (!auth) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-base)',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
