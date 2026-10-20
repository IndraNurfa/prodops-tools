import { Link } from 'react-router-dom';
import './Home.css';

type ToolStatus = 'ready' | 'coming-soon';

interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  status: ToolStatus;
  /** When true, path is an external URL opened in a new tab */
  external?: boolean;
}

const tools: Tool[] = [
  {
    id: 'csv-to-sql',
    title: 'CSV → SQL Converter',
    description:
      'Upload a CSV and generate INSERT statements for customers_data_history, loans, loan_states, and collateral.',
    path: '/csv-to-sql',
    status: 'ready',
  },
  {
    id: 'clik-helpers',
    title: 'CLIK Helpers',
    description: 'External tools for CLIK workflows — open in a new tab.',
    path: 'https://clik-helpers.vercel.app/',
    status: 'ready',
    external: true,
  },
  {
    id: 'mine-tools',
    title: 'ToolsBox',
    description: 'Kumpulan tools yang dibuat sendiri — open in a new tab.',
    path: 'https://mine-tools-umber.vercel.app/',
    status: 'ready',
    external: true,
  },
];

export default function Home() {
  return (
    <div className="page home-page">
      <header className="home-hero">
        <h1>Tools Hub</h1>
        <p>
          Fast, client-side utilities. No backend, no database — everything runs in your browser.
        </p>
      </header>

      <section className="tools-grid">
        {tools.map((tool) => {
          const className = `tool-card ${tool.status === 'coming-soon' ? 'disabled' : ''}`;
          const content = (
            <>
              <div className="tool-card-header">
                <h2>{tool.title}</h2>
                {tool.status === 'ready' && <span className="badge ready">Ready</span>}
                {tool.status === 'coming-soon' && <span className="badge soon">Coming soon</span>}
              </div>
              <p>{tool.description}</p>
              {tool.status === 'ready' && (
                <span className="tool-cta">
                  {tool.external ? 'Open external →' : 'Open tool →'}
                </span>
              )}
            </>
          );

          if (tool.external) {
            return (
              <a
                key={tool.id}
                href={tool.path}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={tool.id} to={tool.path} className={className}>
              {content}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
