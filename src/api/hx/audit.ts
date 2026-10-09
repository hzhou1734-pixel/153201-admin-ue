import request from '@/utils/request'

import {
    agentName,
    bankName,
    branchName,
    businesses,
    currentRole,
    delay,
    eq,
    like,
    loans,
    now,
    paginate,
    pushLog,
    USE_MOCK
} from './mock'

/* ==================== 业务审核（P-06 / P-07） ==================== */

/**
 * 风控初审页状态口径：本页只体现「风控初审」自身的结果
 *  —— 已通过 = 初审通过（放款中的业务已通过初审，已完成即放款完成，同样属于初审已通过）。
 */
const PASSED_BUSINESS_STATUS = ['loaning', 'finished']

/** 业务状态 → 风控初审页展示文案 */
const BUSINESS_STATUS_TEXT: Record<string, string> = {
    auditing: '审核中',
    loaning: '已通过',
    finished: '已通过',
    rejected: '已驳回'
}

/** 业务状态匹配：passed 为聚合筛选（放款中 + 已完成均视为初审已通过） */
const matchBusinessStatus = (status: string, query: string) =>
    !query || (query === 'passed' ? PASSED_BUSINESS_STATUS.includes(status) : status === query)

// 业务审核列表（银行提交材料后进入待审核队列）
export function businessLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.business/lists', params }, { ignoreCancelToken: true })
    }
    const list = businesses
        .filter(
            (item) =>
                like(item.sn, params.sn) &&
                like(item.customer_name, params.customer_name) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.agent_id, params.agent_id) &&
                matchBusinessStatus(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id),
            branch_name: branchName(item.branch_id),
            agent_name: agentName(item.agent_id),
            status_text: BUSINESS_STATUS_TEXT[item.status as string],
            material_count: item.materials.length
        }))
    return paginate(list, params)
}

// 业务状态数量统计（风控初审页状态栏）：按当前筛选条件统计各状态数量，忽略「业务状态」筛选本身
export function businessStatusCounts(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.business/statusCount', params }, { ignoreCancelToken: true })
    }
    const base = businesses.filter(
        (item) =>
            like(item.sn, params.sn) &&
            like(item.customer_name, params.customer_name) &&
            eq(item.bank_id, params.bank_id) &&
            eq(item.agent_id, params.agent_id)
    )
    const count = (status: string) => base.filter((item) => item.status === status).length
    return delay({
        all: base.length,
        auditing: count('auditing'),
        // 「已通过」= 初审已通过（放款中 + 已完成）
        passed: PASSED_BUSINESS_STATUS.reduce((sum, status) => sum + count(status), 0),
        rejected: count('rejected')
    })
}

// 业务详情（含客户资料 / 银行材料；并关联同编号放款审批单的节点与放款记录，供「流程节点记录」展示）
export function businessDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.business/detail', params })
    const item = businesses.find((row) => row.id == params.id)
    const loan = item ? loans.find((l) => l.sn == item.sn) : undefined
    return delay({
        ...item,
        bank_name: item ? bankName(item.bank_id) : '',
        branch_name: item ? branchName(item.branch_id) : '',
        agent_name: item ? agentName(item.agent_id) : '',
        status_text: item ? BUSINESS_STATUS_TEXT[item.status as string] : '',
        // 下游放款审批单节点（放款审核）与确认放款记录
        loan_nodes: loan?.nodes || [],
        pay_user: loan?.pay_user || '',
        pay_time: loan?.pay_time || ''
    })
}

// 审批通过 —— 向客户实名手机号推送签约短信（e签宝签约链接），状态 审核中 → 放款中
export function businessPass(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.business/pass', params })
    const item = businesses.find((row) => row.id == params.id)
    if (item) {
        item.status = 'loaning'
        item.reject_reason = ''
        item.sign_time = now()
        item.review_user = currentRole()
        item.review_time = now()
        item.review_remark = params.remark || ''
        item.review_images = params.images || []
        pushLog(
            '业务审核',
            '审核通过',
            `业务「${item.sn}」审核通过，已向客户 ${item.customer_mobile} 推送签约短信${params.remark ? `，备注：${params.remark}` : ''}${params.images?.length ? `，补充图片 ${params.images.length} 张` : ''}`
        )
    }
    return delay({
        mobile: item?.customer_mobile,
        sn: item?.sn
    })
}

// 审批驳回 —— 必须填写驳回理由，客户端显示"已拒绝"
export function businessReject(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.business/reject', params })
    const item = businesses.find((row) => row.id == params.id)
    if (item) {
        item.status = 'rejected'
        item.reject_reason = params.reason
        item.review_user = currentRole()
        item.review_time = now()
        item.review_remark = params.remark || ''
        item.review_images = params.images || []
        pushLog(
            '业务审核',
            '审核驳回',
            `业务「${item.sn}」驳回：${params.reason}${params.remark ? `，备注：${params.remark}` : ''}${params.images?.length ? `，补充图片 ${params.images.length} 张` : ''}`
        )
    }
    return delay({})
}
