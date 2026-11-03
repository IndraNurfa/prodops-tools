import { useCallback, useEffect, useState } from 'react';
import {
  fetchReports,
  formatSentAt,
  normalizePhone,
  type BodyParam,
  type NotificationRecord,
} from '../lib/notificationApi';
import './NotificationReport.css';
import { Pencil, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'saved_phones';
const MAX_SAVED = 5;

type SavedEntry = { phone: string; alias: string; savedAt: string };

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'empty' }
  | {
      kind: 'ok';
      records: NotificationRecord[];
      count: number;
      total: number;
    }
  | { kind: 'error'; message: string };

function isCopyableParam(value?: string): boolean {
  const v = (value || '').toLowerCase().replace(/-/g, '_');
  return v === 'otp' || v === 'magic_link';
}

function isOtpParam(value?: string): boolean {
  return (value || '').toLowerCase().replace(/-/g, '_') === 'otp';
}

function loadSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedEntry[]) : [];
  } catch {
    return [];
  }
}

function persistSaved(list: SavedEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_SAVED)));
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      className={`btn-copy ${copied ? 'copied' : ''}`}
      onClick={copy}
      disabled={!text}
      aria-label={`Copy ${label}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function ParamsTable({ body }: { body: BodyParam[] }) {
  if (!body.length) {
    return <div className="params-empty">No params.body</div>;
  }
  return (
    <table className="params-table">
      <thead>
        <tr>
          <th>value</th>
          <th>value text</th>
        </tr>
      </thead>
      <tbody>
        {body.map((item, i) => {
          const copyable = isCopyableParam(item.value);
          const otp = isOtpParam(item.value);
          const text = item.value_text ?? '';
          return (
            <tr key={`${item.key ?? i}-${item.value ?? ''}`}>
              <td className="col-value">
                <div className="value-cell">
                  <span className="value-name">{item.value ?? ''}</span>
                  {copyable && <CopyButton label={item.value || 'value'} text={text} />}
                </div>
              </td>
              <td className="col-value-text">
                <span
                  className={
                    copyable
                      ? otp
                        ? 'value-text special otp'
                        : 'value-text special link'
                      : 'value-text'
                  }
                >
                  {text}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function NotificationReport() {
  const [phone, setPhone] = useState('');
  const [limit, setLimit] = useState(1);
  const [saveAfter, setSaveAfter] = useState(false);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const refreshSaved = () => setSaved(loadSaved());

  const savePhone = (raw: string) => {
    const normalized = normalizePhone(raw);
    const list = loadSaved();
    if (list.some((e) => e.phone === normalized)) {
      refreshSaved();
      return;
    }
    list.push({
      phone: normalized,
      alias: '',
      savedAt: new Date().toISOString(),
    });
    persistSaved(list);
    refreshSaved();
  };

  const deletePhone = (normalized: string) => {
    persistSaved(loadSaved().filter((e) => e.phone !== normalized));
    refreshSaved();
  };

  const saveAlias = (normalized: string, alias: string) => {
    const list = loadSaved().map((e) =>
      e.phone === normalized ? { ...e, alias: alias.trim() } : e,
    );
    persistSaved(list);
    setEditingPhone(null);
    refreshSaved();
  };

  const lookup = useCallback(async () => {
    if (!phone.trim()) return;
    setStatus({ kind: 'loading' });
    try {
      const body = await fetchReports(phone, limit);
      const root = body.data;
      const records = root?.data ?? [];
      if (!records.length) {
        setStatus({ kind: 'empty' });
        return;
      }
      setStatus({
        kind: 'ok',
        records,
        count: root?.data_count ?? records.length,
        total: root?.data_total ?? records.length,
      });
      if (saveAfter) {
        savePhone(phone);
        setSaveAfter(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setStatus({ kind: 'error', message });
    }
  }, [phone, limit, saveAfter]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') lookup();
  };

  return (
    <div className="page notif-tool">
      <header className="hero">
        <h1>Notification Report</h1>
        <p>Lookup by phone.</p>
      </header>

      <div className="form-card">
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <div className="input-row">
            <input
              id="phone"
              type="text"
              placeholder="e.g. 0812-3456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              spellCheck={false}
              inputMode="tel"
            />
            <button
              type="button"
              className="btn-primary"
              onClick={lookup}
              disabled={status.kind === 'loading' || !phone.trim()}
            >
              {status.kind === 'loading' ? (
                <>
                  <span className="btn-spinner" aria-hidden />
                  Loading
                </>
              ) : (
                'Lookup'
              )}
            </button>
          </div>
          <div className="format-pills" aria-label="Accepted formats">
            <span className="format-pill">08...</span>
            <span className="format-pill">+628...</span>
            <span className="format-pill">628...</span>
            <span className="format-pill">8...</span>
          </div>
        </div>

        <div className="field-row">
          <div className="field field-limit">
            <label htmlFor="limit">Limit</label>
            <div className="limit-stepper" role="group" aria-label="Result limit">
              <button
                type="button"
                className="limit-btn"
                aria-label="Decrease limit"
                disabled={limit <= 1}
                onClick={() => setLimit((n) => Math.max(1, n - 1))}
              >
                -
              </button>
              <input
                id="limit"
                className="limit-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={limit}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw === '') {
                    setLimit(1);
                    return;
                  }
                  const n = Math.min(100, Math.max(1, parseInt(raw, 10) || 1));
                  setLimit(n);
                }}
                aria-valuemin={1}
                aria-valuemax={100}
                aria-valuenow={limit}
              />
              <button
                type="button"
                className="limit-btn"
                aria-label="Increase limit"
                disabled={limit >= 100}
                onClick={() => setLimit((n) => Math.min(100, n + 1))}
              >
                +
              </button>
            </div>
          </div>
          <label className="save-toggle">
            <input
              type="checkbox"
              checked={saveAfter}
              onChange={(e) => setSaveAfter(e.target.checked)}
            />
            <span>
              Save contact after lookup
              <small>Up to 5 numbers</small>
            </span>
          </label>
        </div>
      </div>

      {saved.length > 0 && (
        <section className="saved-section">
          <div className="saved-label">Saved</div>
          <ul className="saved-list">
            {saved.map((entry) => (
              <li key={entry.phone} className="saved-entry">
                <button type="button" className="saved-fill" onClick={() => setPhone(entry.phone)}>
                  {entry.alias ? (
                    <>
                      <span className="saved-alias">{entry.alias}</span>
                      <span className="saved-phone">{entry.phone}</span>
                    </>
                  ) : (
                    <span className="saved-phone-only">{entry.phone}</span>
                  )}
                </button>

                {editingPhone === entry.phone ? (
                  <div className="alias-edit-row">
                    <input
                      className="alias-input"
                      type="text"
                      value={aliasDraft}
                      placeholder="Alias name"
                      onChange={(e) => setAliasDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveAlias(entry.phone, aliasDraft);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="alias-save-btn"
                      onClick={() => saveAlias(entry.phone, aliasDraft)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="saved-icon-btn"
                      title="Edit alias"
                      aria-label="Edit alias"
                      onClick={() => {
                        setEditingPhone(entry.phone);
                        setAliasDraft(entry.alias || '');
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="saved-icon-btn danger"
                      title="Remove"
                      aria-label="Remove saved number"
                      onClick={() => deletePhone(entry.phone)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {status.kind === 'empty' && (
        <div className="state-box warn">
          No records found
          <span className="sub">No notification reports for this number.</span>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="state-box err">
          Failed to fetch reports
          <span className="sub">{status.message}</span>
        </div>
      )}

      {status.kind === 'ok' && (
        <>
          <div className="result-meta">
            Showing <strong>{status.count}</strong> of <strong>{status.total}</strong> records
          </div>
          <div className="records">
            {status.records.map((rec, idx) => {
              const body = rec.params?.body ?? [];
              return (
                <article key={`${rec.id ?? idx}-${rec.sent_at ?? ''}`} className="record-card">
                  {rec.sent_at && (
                    <div className="record-sent">
                      Sent at <span>{formatSentAt(rec.sent_at) || rec.sent_at}</span>
                    </div>
                  )}
                  <ParamsTable body={body} />
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
