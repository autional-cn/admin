/**
 * Admin Console API functions
 * Uses @autional-cn/shared unified apiClient (auto unwrap + camelCase conversion)
 */

import { apiClient as api } from '@autional-cn/shared';

// All API functions migrated to ./api.generated.ts
// Re-export for backward compat:
export * from './api.generated';
