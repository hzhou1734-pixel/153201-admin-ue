import request from '@/utils/request'

import { adminAccounts, delay, eq, like, nextId, now, paginate, pushLog, USE_MOCK } from './mock'

/**
 * 管理员管理（系统设置 · 管理员管理）
 * 后台管理员账号的创建、停启用与角色绑定；角色取自 HX_ROLES 五个管理层角色。
 */
export function adminLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.admin/lists', params }, { ignoreCancelToken: true })
    }
    const list = adminAccounts.filter(
        (item) =>
            like(item.account, params.account) &&
            like(item.name, params.name) &&
            eq(item.role, params.role) &&
            eq(item.status, params.status)
    )
    return paginate(list, params)
}

export function adminAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.admin/add', params })
    adminAccounts.push({
        id: nextId(adminAccounts),
        create_time: now(),
        last_login_time: '',
        ...params
    })
    pushLog('系统设置', '新增管理员', `创建「${params.role}」账号 ${params.account}`)
    return delay({})
}

export function adminEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.admin/edit', params })
    const index = adminAccounts.findIndex((item) => item.id == params.id)
    if (index > -1) adminAccounts[index] = { ...adminAccounts[index], ...params }
    pushLog('系统设置', '编辑管理员', `更新账号 ${params.account}`)
    return delay({})
}

export function adminDelete(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.admin/delete', params })
    const index = adminAccounts.findIndex((item) => item.id == params.id)
    if (index > -1) adminAccounts.splice(index, 1)
    return delay({})
}

export function adminStatus(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.admin/status', params })
    const item = adminAccounts.find((row) => row.id == params.id)
    if (item) item.status = params.status
    return delay({})
}
