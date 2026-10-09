import request from '@/utils/request'

import {
    banks,
    branches,
    delay,
    eq,
    like,
    nextId,
    paginate,
    USE_MOCK
} from './mock'

/* ==================== 银行（P-03） ==================== */

// 银行列表
export function bankLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.bank/lists', params }, { ignoreCancelToken: true })
    }
    const list = banks
        .filter((item) => like(item.name, params.name) && eq(item.status, params.status))
        .map((item) => ({ ...item, branch_count: branches.filter((b) => b.bank_id == item.id).length }))
    return paginate(list, params)
}

// 银行全部（下拉用）
export function bankAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.bank/all', params })
    return delay(banks.filter((item) => item.status === 1).map((item) => ({ ...item })))
}

// 银行新增
export function bankAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bank/add', params })
    banks.push({ id: nextId(banks), create_time: '', ...params })
    return delay({})
}

// 银行编辑
export function bankEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bank/edit', params })
    const index = banks.findIndex((item) => item.id == params.id)
    if (index > -1) banks[index] = { ...banks[index], ...params }
    return delay({})
}

// 银行详情
export function bankDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.bank/detail', params })
    return delay({ ...banks.find((item) => item.id == params.id) })
}

/* ==================== 支行（P-03） ==================== */

// 支行列表
export function branchLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.branch/lists', params }, { ignoreCancelToken: true })
    }
    const list = branches
        .filter(
            (item) =>
                like(item.name, params.name) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.city, params.city) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: banks.find((b) => b.id == item.bank_id)?.name || '—'
        }))
    return paginate(list, params)
}

// 支行全部（按银行过滤，下拉用）
export function branchAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.branch/all', params })
    const list = branches
        .filter((item) => item.status === 1 && eq(item.bank_id, params.bank_id))
        .map((item) => ({
            ...item,
            bank_name: banks.find((b) => b.id == item.bank_id)?.name || '—'
        }))
    return delay(list)
}

// 支行新增
export function branchAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.branch/add', params })
    branches.push({ id: nextId(branches), create_time: '', ...params })
    return delay({})
}

// 支行编辑
export function branchEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.branch/edit', params })
    const index = branches.findIndex((item) => item.id == params.id)
    if (index > -1) branches[index] = { ...branches[index], ...params }
    return delay({})
}

// 支行详情
export function branchDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.branch/detail', params })
    const item = branches.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? banks.find((b) => b.id == item.bank_id)?.name || '' : ''
    })
}

