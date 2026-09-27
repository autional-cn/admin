'use client';

import { extractList, extractItem } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getFiles,
	uploadFile,
	getStorageQuota,
	getStorageStats,
	getStorageTrash,
	restoreTrashItem,
	deleteTrashItem,
} from '@/lib/api.generated';
import * as Generated from '@autional-cn/shared/generated/api';

export interface FileRecord {
	id: string;
	name: string;
	type: string;
	size: number;
	createdAt: string;
	path: string;
	isPublic: boolean;
}

export interface TrashRecord {
	id: string;
	name: string;
	type: string;
	size: number;
	deletedAt: string;
	isPublic: boolean;
}

export interface StorageQuota {
	/** 总容量（后端 quota_bytes，camelCase 后为 quotaBytes） */
	quotaBytes?: number;
	/** 已用容量（后端 used_bytes） */
	usedBytes?: number;
	/** 剩余可用容量（后端 available_bytes） */
	availableBytes?: number;
	/** 使用占比（后端 usage_percent） */
	usagePercent?: number;
	/** 兼容别名：旧字段 totalBytes */
	totalBytes?: number;
}

export interface StorageStats {
	totalFiles?: number;
	totalSize?: number;
}

export function useFiles(params?: {
	parentId?: string;
	page?: number;
	pageSize?: number;
	keyword?: string;
}) {
	return useQuery({
		queryKey: queryKeys.storage.files(params),
		queryFn: async () => {
			const res = await getFiles(params);
			return extractList<FileRecord>(res);
		},
	});
}

export function useStorageQuota() {
	return useQuery({
		queryKey: queryKeys.storage.quota,
		queryFn: async () => {
			const res = await getStorageQuota();
			return extractItem<StorageQuota>(res) ?? ({} as StorageQuota);
		},
	});
}

export function useStorageStats() {
	return useQuery({
		queryKey: queryKeys.storage.stats,
		queryFn: async () => {
			const res = await getStorageStats();
			return extractItem<StorageStats>(res) ?? ({} as StorageStats);
		},
	});
}

export function useStorageTrash() {
	return useQuery({
		queryKey: queryKeys.storage.trash,
		queryFn: async () => {
			const res = await getStorageTrash();
			return extractList<TrashRecord>(res);
		},
	});
}

export function useRestoreTrashItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: restoreTrashItem,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storage.trash }),
	});
}

export function useDeleteTrashItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteTrashItem,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storage.trash }),
	});
}

export function useCreateFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Record<string, unknown>) => Generated.storageFoldersPost(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
		},
	});
}

export function useDeleteFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => Generated.filesByFilesDelete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: queryKeys.storage.trash });
		},
	});
}
