import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../services/api';
import type { AppNotification } from '../../types';
import { formatDbDateTime } from '../../utils/date';

interface NotificationBellProps {
  /** Se invoca al abrir una notificación de reposición (el id de la solicitud puede venir vacío). */
  onOpenReplenishment: (requestId: string | null) => void;
}

const POLL_MS = 30000;

/** HU-13 / T06: campana de notificaciones internas (Logística ve nuevas solicitudes; el distribuidor ve entregas completadas). */
export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenReplenishment }) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      setUnread(data.unread);
      setItems(data.notifications);
    } catch {
      /* sin conexión: se conserva el último estado */
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleOpenItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.is_read) {
      await api.notifications.markRead(n.id).catch(() => {});
    }
    onOpenReplenishment(n.replenishment_request_id ?? null);
    refresh();
  };

  const handleReadAll = async () => {
    await api.notifications.markAllRead().catch(() => {});
    refresh();
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) refresh();
        }}
        title="Notificaciones"
        aria-label="Notificaciones"
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-2xs min-w-4 h-4 px-1 rounded-full font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Notificaciones</span>
            {unread > 0 && (
              <button onClick={handleReadAll} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 text-center">No tiene notificaciones.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenItem(n)}
                  className={`w-full text-left px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${n.is_read ? '' : 'bg-indigo-50/60'}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                      <div className="text-xs text-slate-600">{n.message}</div>
                      <div className="text-2xs text-slate-400 mt-0.5">{formatDbDateTime(n.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
