import request from '@/utils/request'

import { buildDefaultPerms, delay, pushLog, rolePermissions, USE_MOCK } from './mock'

/**
 * 角色管理（系统设置 · 角色管理）
 * 角色权限以「功能板块 × 操作」的矩阵存储，可逐项分配权限颗粒度。
 */
export function rolePermissionDetail(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.role/perm', params }, { ignoreCancelToken: true })
    }
    const perms = rolePermissions[params.role] || buildDefaultPerms(params.role)
    return delay({ role: params.role, perms })
}

export function rolePermissionSave(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.role/permSave', params })
    rolePermissions[params.role] = params.perms
    pushLog('系统设置', '分配角色权限', `更新「${params.role}」在各功能板块的权限颗粒度`)
    return delay({})
}
