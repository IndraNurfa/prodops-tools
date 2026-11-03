import { useCallback, useRef, useState } from 'react';
import { csvTextToSql, parseCSV, rowsToObjects } from '../lib/csvToSql';
import './CsvToSql.css';
import { Check, Copy, Upload } from 'lucide-react';

export default function CsvToSql() {
  const [status, setStatus] = useState<{ msg: string; type: '' | 'ok' | 'err' }>({
    msg: '',
    type: '',
  });
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sql, setSql] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setStatus({ msg: 'Please upload a .csv file', type: 'err' });
      return;
    }

    try {
      const text = await file.text();
      const result = csvTextToSql(text);

      if (result.rowCount === 0) {
        setStatus({ msg: 'No data rows found in CSV', type: 'err' });
        setPreviewRows([]);
        setHeaders([]);
        setSql('');
        setRowCount(0);
        return;
      }

      setHeaders(result.headers);
      setRowCount(result.rowCount);
      setSql(result.sql);

      const objects = rowsToObjects(parseCSV(text));
      setPreviewRows(objects.slice(0, 20));

      setStatus({
        msg: `Loaded ${result.rowCount} row${result.rowCount === 1 ? '' : 's'} from ${file.name}`,
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setStatus({ msg: 'Failed to parse CSV', type: 'err' });
      setPreviewRows([]);
      setSql('');
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
      setStatus({ msg: 'Copy failed', type: 'err' });
    }
  };

  const previewHeaders = headers.slice(0, 8);

  return (
    <div className="page csv-tool">
      <header className="hero">
        <h1>CSV → SQL Converter</h1>
        <p>Upload a CSV and get INSERT statements for manual loans car.</p>
      </header>

      <div
        className={`action-card ${dragOver ? 'dragover' : ''}`}
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
            <Upload size={18} />
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
        <p className={`action-meta ${status.type}`}>{status.msg || '\u00A0'}</p>
      </div>

      <div className="panels">
        <section className="panel">
          <div className="panel-header">
            <h2>CSV Preview</h2>
            <span className="badge">{rowCount > 0 ? `${rowCount} rows` : '—'}</span>
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
                        <td key={h}>{row[h] ?? ''}</td>
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
            <button
              type="button"
              className={`btn-copy-sql ${copied ? 'copied' : ''}`}
              disabled={!sql}
              onClick={copySql}
            >
              {copied ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
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

      <div className={`toast ${toastVisible ? 'show' : ''}`}>Copied to clipboard</div>
    </div>
  );
}
