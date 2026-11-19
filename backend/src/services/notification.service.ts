import { notificationRepository } from '../repositories/notification.repository';
import { AppNotification, AuthUser } from '../types/domain';
import { AppError } from '../types/responses';

export class NotificationService {
  /** HU-13 / T06: bandeja de notificaciones internas (Logística recibe nuevas solicitudes). */
  async list(user: AuthUser): Promise<{ unread: number; notifications: AppNotification[] }> {
    const [notifications, unread] = await Promise.all([
      notificationRepository.listFor(user),
      notificationRepository.countUnread(user)
    ]);
    return { unread, notifications };
  }

  async markRead(user: AuthUser, id: string): Promise<void> {
    const ok = await notificationRepository.markRead(user, id);
    if (!ok) throw AppError.notFound('La notificación no existe o no le corresponde', 'NOTIFICATION_NOT_FOUND');
  }

  async markAllRead(user: AuthUser): Promise<void> {
    await notificationRepository.markAllRead(user);
  }
}

export const notificationService = new NotificationService();
