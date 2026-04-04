import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const { pathname } = useLocation();
  const active =
    to === '/'
      ? pathname === '/'
      : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      style={{
        fontWeight: active ? 700 : 400,
        textDecoration: 'none',
        color: active ? '#0972d3' : '#545b64',
        padding: '2px 0',
        borderBottom: active ? '2px solid #0972d3' : '2px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}

export function AppLayout() {
  return (
    <Box>
      <Box
        padding={{ horizontal: 'l', vertical: 'm' }}
        variant="div"
        margin={{ bottom: 'xs' }}
      >
        <SpaceBetween direction="horizontal" size="l">
          <NavLink to="/">プロジェクト一覧</NavLink>
          <NavLink to="/dashboard">ダッシュボード</NavLink>
          <NavLink to="/compare">プロジェクト比較</NavLink>
        </SpaceBetween>
      </Box>
      <Outlet />
    </Box>
  );
}
