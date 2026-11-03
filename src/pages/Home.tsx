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
    title: 'CSV → SQL',
    description: 'CSV to INSERT statements for manual loans car.',
    path: '/csv-to-sql',
    status: 'ready',
  },
  {
    id: 'notification-report',
    title: 'Notification Report',
    description: 'Lookup reports by phone.',
    path: '/notification-report',
    status: 'ready',
  },
  {
    id: 'rbac-dus',
    title: 'Insert Users DUS',
    description: 'Query insert from rbac to dus.',
    path: '/rbac-dus',
    status: 'coming-soon',
  },
  {
    id: 'clik-helpers',
    title: 'CLIK Helpers',
    description: 'External CLIK workflow tools.',
    path: 'https://clik-helpers.vercel.app/',
    status: 'ready',
    external: true,
  },
  {
    id: 'mine-tools',
    title: 'Tollbox',
    description: 'Personal tools collection.',
    path: 'https://mine-tools-umber.vercel.app/',
    status: 'ready',
    external: true,
  },
];

export default function Home() {
  return (
    <div className="page home-page">
      <header className="home-header">
        <h1>Tools</h1>
        <p>{tools.filter((t) => t.status === 'ready').length} available</p>
      </header>

      <section className="tools-grid" aria-label="Tool launcher">
        {tools.map((tool) => {
          const className = `tool-card ${tool.status === 'coming-soon' ? 'disabled' : ''}`;
          const content = (
            <>
              <div className="tool-card-top">
                <h2>{tool.title}</h2>
                {tool.external && (
                  <span className="badge external" title="Opens in new tab">
                    External
                  </span>
                )}
                {tool.status === 'coming-soon' && <span className="badge soon">Soon</span>}
              </div>
              <p>{tool.description}</p>
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
