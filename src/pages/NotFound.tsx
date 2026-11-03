import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="page notfound-page">
      <p className="notfound-code">404</p>
      <h1>Page not found</h1>
      <p className="notfound-sub">This route doesn't exist.</p>
      <Link to="/" className="notfound-link">
        ← Back to tools
      </Link>
    </div>
  );
}
