import { Link } from "react-router-dom";
import "./Home.css";

type ToolStatus = "ready" | "coming-soon";

interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  status: ToolStatus;
}

const tools: Tool[] = [
  {
    id: "csv-to-sql",
    title: "CSV → SQL Converter",
    description:
      "Upload a CSV and generate INSERT statements for customers_data_history, loans, loan_states, and collateral.",
    path: "/csv-to-sql",
    status: "ready",
  },
  // Future tools can be added here:
  // {
  //   id: "another-tool",
  //   title: "Another Tool",
  //   description: "...",
  //   path: "/another-tool",
  //   status: "coming-soon",
  // },
];

export default function Home() {
  return (
    <div className="page home-page">
      <header className="home-hero">
        <h1>Tools Hub</h1>
        <p>
          Fast, client-side utilities. No backend, no database — everything runs
          in your browser.
        </p>
      </header>

      <section className="tools-grid">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className={`tool-card ${tool.status === "coming-soon" ? "disabled" : ""}`}
          >
            <div className="tool-card-header">
              <h2>{tool.title}</h2>
              {tool.status === "ready" && (
                <span className="badge ready">Ready</span>
              )}
              {tool.status === "coming-soon" && (
                <span className="badge soon">Coming soon</span>
              )}
            </div>
            <p>{tool.description}</p>
            {tool.status === "ready" && (
              <span className="tool-cta">Open tool →</span>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
