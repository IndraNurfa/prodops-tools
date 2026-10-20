import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <nav className="global-nav">
        <Link to="/" className="nav-brand">
          Tools Hub
        </Link>
        <div className="nav-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/csv-to-sql" className={pathname === '/csv-to-sql' ? 'active' : ''}>
            CSV → SQL
          </Link>
          <a href="https://clik-helpers.vercel.app/" target="_blank" rel="noopener noreferrer">
            CLIK Helpers
          </a>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
