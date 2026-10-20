import { useCallback, useRef, useState } from "react";
import { csvTextToSql, parseCSV, rowsToObjects } from "../lib/csvToSql";
import "./CsvToSql.css";

export default function CsvToSql() {
  const [status, setStatus] = useState<{ msg: string; type: "" | "ok" | "err" }>({
    msg: "",
    type: "",
  });
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sql, setSql] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setStatus({ msg: "Please upload a .csv file", type: "err" });
      return;
    }

    try {
      const text = await file.text();
      const result = csvTextToSql(text);

      if (result.rowCount === 0) {
        setStatus({ msg: "No data rows found in CSV", type: "err" });
        setPreviewRows([]);
        setHeaders([]);
        setSql("");
        setRowCount(0);
        return;
      }

      setHeaders(result.headers);
      setRowCount(result.rowCount);
      setSql(result.sql);

      const objects = rowsToObjects(parseCSV(text));
      setPreviewRows(objects.slice(0, 20));

      setStatus({
        msg: `Loaded ${result.rowCount} row${result.rowCount === 1 ? "" : "s"} from ${file.name}`,
        type: "ok",
      });
    } catch (err) {
      console.error(err);
      setStatus({ msg: "Failed to parse CSV", type: "err" });
      setPreviewRows([]);
      setSql("");
      setRowCount(0);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const copySql = async () => {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setToastVisible(true);
      setTimeout(() => {
        setCopied(false);
        setToastVisible(false);
      }, 2000);
    } catch {
      setStatus({ msg: "Copy failed", type: "err" });
    }
  };

  const previewHeaders = headers.slice(0, 8);

  return (
    <div className="page csv-tool">
      <header className="hero">
        <h1>CSV → SQL Converter</h1>
        <p>
          Upload a CSV and get INSERT statements for customers_data_history,
          loans, loan_states, and collateral.
        </p>
      </header>

      <div
        className={`action-card ${dragOver ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p className="drop-hint">Drop a CSV file here</p>
        <p className="drop-sub">or click the button to browse</p>
        <div className="action-row">
          <label className="file-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Choose file
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              hidden
            />
          </label>
        </div>
        <p className={`action-meta ${status.type}`}>{status.msg || "\u00A0"}</p>
      </div>

      <div className="panels">
        <section className="panel">
          <div className="panel-header">
            <h2>CSV Preview</h2>
            <span className="badge">
              {rowCount > 0 ? `${rowCount} rows` : "—"}
            </span>
          </div>
          <div className="table-wrap">
            {previewRows.length === 0 ? (
              <div className="empty">Upload a CSV to preview rows.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {previewHeaders.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                    {headers.length > 8 && <th>…</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {previewHeaders.map((h) => (
                        <td key={h}>{row[h] ?? ""}</td>
                      ))}
                      {headers.length > 8 && <td>…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>SQL Output</h2>
            <span className="badge">{rowCount > 0 ? `${rowCount} × 4 tables` : "—"}</span>
          </div>
          <div className="sql-actions">
            <button
              className="btn btn-primary"
              disabled={!sql}
              onClick={copySql}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy SQL
                </>
              )}
            </button>
          </div>
          <textarea
            className="sql-output"
            readOnly
            value={sql}
            placeholder="SQL appears here after upload…"
            spellCheck={false}
          />
        </section>
      </div>

      <div className={`toast ${toastVisible ? "show" : ""}`}>Copied to clipboard</div>
    </div>
  );
}
