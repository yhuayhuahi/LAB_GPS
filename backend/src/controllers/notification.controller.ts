import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../types/responses';

const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data, timestamp: new Date().toISOString() });

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(ok(await notificationService.list(req.user!)));
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markRead(req.user!, req.params.id);
    res.status(200).json(ok({ id: req.params.id, is_read: true }));
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllRead(req.user!);
    res.status(200).json(ok({ updated: true }));
  } catch (err) {
    next(err);
  }
}
