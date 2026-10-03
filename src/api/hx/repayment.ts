import request from '@/utils/request'

import { delay, eq, like, now, paginate, pushLog, repayments, USE_MOCK } from './mock'

/* ==================== 回款凭证确认（P-10） ==================== */

// 待确认凭证列表（凭证由业务经办人 Y-03 上传）
export function repaymentLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.repayment/lists', params }, { ignoreCancelToken: true })
    }
    const list = repayments
        .filter(
            (item) =>
                like(item.sn, params.sn) &&
                like(item.customer_name, params.customer_name) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            status_text: ['待确认', '已确认', '已驳回'][item.status],
            voucher_count: item.vouchers.length
        }))
    return paginate(list, params)
}

export function repaymentDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.repayment/detail', params })
    const item = repayments.find((row) => row.id == params.id)
    return delay({
        ...item,
        status_text: ['待确认', '已确认', '已驳回'][item?.status ?? 0]
    })
}

// 确认审核（仅财务可确认；此环节不影响放款）
export function repaymentConfirm(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.repayment/confirm', params })
    const item = repayments.find((row) => row.id == params.id)
    if (item) {
        item.status = 1
        item.reason = ''
        item.confirm_user = params.confirm_user || '财务负责人'
        item.confirm_time = now()
        pushLog('回款管理', '凭证确认', `业务「${item.sn}」回款凭证已确认`)
    }
    return delay({})
}

// 驳回（业务经办人可重新上传）
export function repaymentReject(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.repayment/reject', params })
    const item = repayments.find((row) => row.id == params.id)
    if (item) {
        item.status = 2
        item.reason = params.reason
        item.confirm_user = params.confirm_user || '财务负责人'
        item.confirm_time = now()
        pushLog('回款管理', '凭证驳回', `业务「${item.sn}」回款凭证驳回：${params.reason}`)
    }
    return delay({})
}
