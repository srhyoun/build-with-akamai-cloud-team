import { useEffect, useState } from 'react';
import './status-pill.css';

type Status = 'up' | 'down' | 'off' | 'unknown';
type Service = 'Inference' | 'DB' | 'Storage';
type Services = Record<Service, Status>;

const UNKNOWN: Services = { Inference: 'unknown', DB: 'unknown', Storage: 'unknown' };
const LABELS: Record<Status, string> = { up: 'Up', down: 'Down', off: 'Off', unknown: 'Unknown' };
const POLL_MS = 15_000;
const TIMEOUT_MS = 10_000;

function readHealth(payload: unknown): Services {
  if (!payload || typeof payload !== 'object') return UNKNOWN;
  const { ok, model, db, storage } = payload as Record<string, unknown>;
  if (ok !== true) return UNKNOWN;
  return {
    Inference: typeof model === 'string' && model.trim() ? 'up' : model === null ? 'off' : 'unknown',
    DB: db === 'up' || db === 'down' || db === 'off' ? db : 'unknown',
    Storage: storage === 'up' || storage === 'down' ? storage : 'unknown',
  };
}

export function StatusPill() {
  const [services, setServices] = useState<Services>(UNKNOWN);

  useEffect(() => {
    let current: AbortController | undefined;

    async function refresh() {
      current?.abort();
      const request = new AbortController();
      current = request;
      const timeout = window.setTimeout(() => request.abort(), TIMEOUT_MS);
      let next = UNKNOWN;

      try {
        const response = await fetch('/api/health', { cache: 'no-store', signal: request.signal });
        if (response.ok) next = readHealth(await response.json());
      } catch {
        // Keep the fallback during network failures, timeouts and malformed responses.
      } finally {
        window.clearTimeout(timeout);
      }

      if (current === request) {
        current = undefined;
        setServices(next);
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      window.clearInterval(interval);
      const request = current;
      current = undefined;
      request?.abort();
    };
  }, []);

  return (
    <span className="status-pill" role="group" aria-label="Service status">
      {Object.entries(services).map(([service, status]) => {
        const label = service === 'Inference' && status === 'up' ? 'Configured' : LABELS[status];
        const description = `${service}: ${label}`;
        return (
          <span className="status-pill__service" key={service} role="img" aria-label={description} title={description}>
            <span className="status-pill__dot" data-state={status} aria-hidden="true" />
            {service}
          </span>
        );
      })}
    </span>
  );
}
