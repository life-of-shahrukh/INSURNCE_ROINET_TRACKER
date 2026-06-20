import { request } from './fetch-client';
import type { PaginatedResponse } from './pagination-types';

export type AnnouncementSeverity = 'info' | 'warning' | 'success' | 'error';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: string;
  severity: AnnouncementSeverity;
  priority: number;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetRoles: string;
  severity?: AnnouncementSeverity;
  priority?: number;
  isActive?: boolean;
  startsAt: string;
  expiresAt?: string | null;
}

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

export function fetchAllAnnouncements(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<Announcement>> {
  return request<PaginatedResponse<Announcement>>(
    `/api/announcements?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchActiveAnnouncements(): Promise<Announcement[]> {
  return request<Announcement[]>('/api/announcements/active');
}

export function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Announcement> {
  return request<Announcement>('/api/announcements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput,
): Promise<Announcement> {
  return request<Announcement>(`/api/announcements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAnnouncement(id: string): Promise<void> {
  return request<void>(`/api/announcements/${id}`, { method: 'DELETE' });
}

export function dismissAnnouncement(id: string): Promise<void> {
  return request<void>(`/api/announcements/${id}/dismiss`, { method: 'POST' });
}
