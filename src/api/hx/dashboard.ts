import request from '@/utils/request'

import {
    agentName,
    agents,
    bankAgents,
    bankName,
    banks,
    branchName,
    branches,
    businesses,
    customers,
    delay,
    loans,
    now,
    operationLogs,
    repayments,
    USE_MOCK
} from './mock'
import { approvalRoles } from './loan'

/**
 * 工作台 · 业务数据总览
 *
 * 统计口径（全部来源于本系统基础业务数据，不含任何外部系统）：
 * - 客户：客户总数 / 已扫码绑定 / 未归属（待总经理分配）
 * - 业务：业务总数、累计申请金额、各状态分布（审核中 / 放款中 / 已完成 / 已驳回）
 * - 放款：审批中、待放款登记（审批通过待财务线下放款后登记）、已放款
 * - 回款：待确认凭证、累计已确认回款、已驳回
 * - 机构：合作银行、支行、业务经办人（启用 / 停用）
 */

/** 业务状态字典（与业务审核页保持一致） */
const BUSINESS_STATUS: Record<string, string> = {
    auditing: '审核中',
    loaning: '放款中',
    finished: '已完成',
    rejected: '已驳回'
}

/** 分状态汇总：笔数 + 金额 */
function groupByStatus() {
    const map: Record<string, { count: number; amount: number }> = {}
    Object.keys(BUSINESS_STATUS).forEach((key) => {
        map[key] = { count: 0, amount: 0 }
    })
    businesses.forEach((item) => {
        const bucket = map[item.status] || (map[item.status] = { count: 0, amount: 0 })
        bucket.count += 1
        bucket.amount += Number(item.amount) || 0
    })
    return map
}

/** 取最近 N 个月的月份标签（末端为数据中最新月份，无数据时取当前月） */
function recentMonths(size = 6): string[] {
    let base = new Date()
    const times = businesses.map((item) => item.submit_time).filter(Boolean).sort()
    if (times.length) {
        const last = times[times.length - 1]
        const [y, m] = last.slice(0, 7).split('-').map(Number)
        base = new Date(y, m - 1, 1)
    }
    const list: string[] = []
    for (let i = size - 1; i >= 0; i--) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
        list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return list
}

/** 放款审批当前节点（顺序固定不可跳级，见 P-08） */
function currentNode(item: any): string {
    const node = (item.nodes || []).find((n: any) => n.status === 0)
    return node?.role || ''
}

/** 按角色生成待办事项（权限拆分：每个角色只看到自己职责范围内的待办） */
function buildTodo(role: string) {
    const todo: any[] = []
    const isSuper = role === '超级管理员' || !role

    const auditCount = businesses.filter((item) => item.status === 'auditing').length
    const unboundCount = customers.filter((item) => item.bind_status != 1).length
    const pendingLoan = loans.filter((item) => item.status === 'approved' && item.paid_status != 1)
    const pendingVoucher = repayments.filter((item) => item.status === 0)
    const myApproval = loans.filter((item) => item.status === 'pending' && currentNode(item) === role)

    if (isSuper || role === '风控负责人') {
        todo.push({
            title: '待审核业务',
            count: auditCount,
            path: '/hx/audit/business',
            desc: '银行提交材料后进入的待审核队列（P-06）',
            type: 'warning'
        })
    }
    if (isSuper || ['风控负责人', '财务负责人', '总经理', '董事长'].includes(role)) {
        todo.push({
            title: '待我审批的放款',
            count: isSuper ? loans.filter((item) => item.status === 'pending').length : myApproval.length,
            path: '/hx/loan/approval',
            desc: '放款审批流转，顺序固定不可跳级（P-08）',
            type: 'primary'
        })
    }
    if (isSuper || role === '财务负责人') {
        todo.push({
            title: '待确认回款凭证',
            count: pendingVoucher.length,
            path: '/hx/repayment/pending',
            desc: '经办人上传的回款凭证，核对后确认或驳回（P-10）',
            type: 'danger'
        })
    }
    if (isSuper || role === '总经理') {
        todo.push({
            title: '未归属客户',
            count: unboundCount,
            path: '/hx/customer/assign',
            desc: '未扫码注册客户，由总经理指定业务经办人（P-04）',
            type: 'info'
        })
    }
    return todo
}

/** 统计待认证的经办人（auth_status = 1 表示待审核） */
/** 银行经办人在岗数量（启用状态） */
function countBankAgentOn(): number {
    return bankAgents.filter((item) => item.status === 1).length
}

/* ==================== 工作台总览 ==================== */

export function dashboardOverview(params: any = {}) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.dashboard/overview', params }, { ignoreCancelToken: true })
    }
    const role = params.role || ''
    const statusMap = groupByStatus()

    // 放款
    const approving = loans.filter((item) => item.status === 'pending')
    const pendingLoan = loans.filter((item) => item.status === 'approved' && item.paid_status != 1)
    const paidLoan = loans.filter((item) => item.paid_status == 1)
    const sum = (list: any[]) => list.reduce((total, item) => total + (Number(item.amount) || 0), 0)

    // 回款
    const pendingVoucher = repayments.filter((item) => item.status === 0)
    const confirmedVoucher = repayments.filter((item) => item.status === 1)
    const rejectedVoucher = repayments.filter((item) => item.status === 2)

    // 机构
    const agentOn = agents.filter((item) => item.status == 1).length
    const branchOn = branches.filter((item) => item.status == 1).length

    // 趋势
    const months = recentMonths(6)
    const trend = months.map((month) => {
        const list = businesses.filter((item) => (item.submit_time || '').slice(0, 7) === month)
        return {
            month,
            count: list.length,
            amount: Math.round(sum(list) / 10000)
        }
    })

    // 市州分布（支行归属 → 业务金额）
    const cityMap: Record<string, { amount: number; count: number }> = {}
    businesses.forEach((item) => {
        const branch = branches.find((b) => b.id == item.branch_id)
        const city = branch?.city || '未归属'
        const bucket = cityMap[city] || (cityMap[city] = { amount: 0, count: 0 })
        bucket.amount += Number(item.amount) || 0
        bucket.count += 1
    })
    const cityRank = Object.entries(cityMap)
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.amount - a.amount)

    // 银行排行
    const bankMap: Record<string, { amount: number; count: number }> = {}
    businesses.forEach((item) => {
        const name = bankName(item.bank_id)
        const bucket = bankMap[name] || (bankMap[name] = { amount: 0, count: 0 })
        bucket.amount += Number(item.amount) || 0
        bucket.count += 1
    })
    const bankRank = Object.entries(bankMap)
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.amount - a.amount)

    // 经办人业绩 TOP5（按业务金额）
    const agentMap: Record<string, { amount: number; count: number }> = {}
    businesses.forEach((item) => {
        const name = agentName(item.agent_id)
        const bucket = agentMap[name] || (agentMap[name] = { amount: 0, count: 0 })
        bucket.amount += Number(item.amount) || 0
        bucket.count += 1
    })
    const agentRank = Object.entries(agentMap)
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

    return delay({
        update_time: now(),
        role,
        /** 核心指标卡：value 已换算为「万元」，便于大屏阅读 */
        cards: [
            {
                key: 'customer_total',
                title: '客户总数',
                value: customers.length,
                unit: '个',
                hint: `未归属 ${customers.filter((i) => i.bind_status != 1).length} 个`,
                path: '/hx/customer/list',
                icon: 'el-icon-UserFilled',
                color: '#4b7fff'
            },
            {
                key: 'business_total',
                title: '业务总数',
                value: businesses.length,
                unit: '笔',
                hint: `累计申请 ${(sum(businesses) / 10000).toFixed(2)} 万元`,
                path: '/hx/audit/business',
                icon: 'el-icon-Document',
                color: '#6c5ce7'
            },
            {
                key: 'business_auditing',
                title: '审核中业务',
                value: statusMap.auditing.count,
                unit: '笔',
                hint: `${(statusMap.auditing.amount / 10000).toFixed(2)} 万元待审核`,
                path: '/hx/audit/business',
                icon: 'el-icon-Clock',
                color: '#f7a325'
            },
            {
                key: 'business_loaning',
                title: '放款中业务',
                value: statusMap.loaning.count,
                unit: '笔',
                hint: `签约后待放款 ${(statusMap.loaning.amount / 10000).toFixed(2)} 万元`,
                path: '/hx/loan/approval',
                icon: 'el-icon-Loading',
                color: '#ff7d5c'
            },
            {
                key: 'loan_pending',
                title: '待放款登记',
                value: pendingLoan.length,
                unit: '笔',
                hint: `${(sum(pendingLoan) / 10000).toFixed(2)} 万元待财务登记`,
                path: '/hx/loan/pending/records',
                icon: 'el-icon-CreditCard',
                color: '#e2564d'
            },
            {
                key: 'loan_paid',
                title: '累计放款',
                value: paidLoan.length,
                unit: '笔',
                hint: `${(sum(paidLoan) / 10000).toFixed(2)} 万元已放款`,
                path: '/hx/loan/pending/records',
                icon: 'el-icon-Money',
                color: '#1cb88a'
            },
            {
                key: 'repay_confirmed',
                title: '累计回款',
                value: confirmedVoucher.length,
                unit: '笔',
                hint: `${(sum(confirmedVoucher) / 10000).toFixed(2)} 万元已确认`,
                path: '/hx/repayment/records',
                icon: 'el-icon-Coin',
                color: '#2bb3c0'
            },
            {
                key: 'repay_pending',
                title: '待确认凭证',
                value: pendingVoucher.length,
                unit: '笔',
                hint: `${(sum(pendingVoucher) / 10000).toFixed(2)} 万元待财务核对`,
                path: '/hx/repayment/pending',
                icon: 'el-icon-Warning',
                color: '#8a7bd6'
            }
        ],
        /** 分组明细 */
        groups: {
            customer: {
                total: customers.length,
                bound: customers.filter((i) => i.bind_status == 1).length,
                unbound: customers.filter((i) => i.bind_status != 1).length
            },
            business: {
                total: businesses.length,
                total_amount: sum(businesses),
                auditing: statusMap.auditing,
                loaning: statusMap.loaning,
                finished: statusMap.finished,
                rejected: statusMap.rejected
            },
            loan: {
                approving_count: approving.length,
                approving_amount: sum(approving),
                pending_count: pendingLoan.length,
                pending_amount: sum(pendingLoan),
                paid_count: paidLoan.length,
                paid_amount: sum(paidLoan),
                rejected_count: loans.filter((i) => i.status === 'rejected').length
            },
            repayment: {
                pending_count: pendingVoucher.length,
                pending_amount: sum(pendingVoucher),
                confirmed_count: confirmedVoucher.length,
                confirmed_amount: sum(confirmedVoucher),
                rejected_count: rejectedVoucher.length
            },
            org: {
                bank_total: banks.length,
                bank_on: banks.filter((i) => i.status == 1).length,
                branch_total: branches.length,
                branch_on: branchOn,
                agent_total: agents.length,
                agent_on: agentOn,
                agent_off: agents.length - agentOn,
                agent_pending: agents.filter((i) => i.auth_status !== 2).length,
                bank_agent_total: bankAgents.length,
                bank_agent_on: countBankAgentOn()
            }
        },
        /** 待办（按角色过滤） */
        todo: buildTodo(role),
        charts: {
            status: Object.keys(BUSINESS_STATUS).map((key) => ({
                name: BUSINESS_STATUS[key],
                value: statusMap[key]?.count || 0
            })),
            trend,
            city: cityRank.map((item) => ({ ...item, amount: Math.round(item.amount / 10000) })),
            bank: bankRank.map((item) => ({ ...item, amount: Math.round(item.amount / 10000) })),
            agent: agentRank.map((item) => ({ ...item, amount: Math.round(item.amount / 10000) }))
        },
        /** 最近动态（取操作日志前 8 条） */
        logs: operationLogs.slice(0, 8)
    })
}

/** 工作台快捷入口：按当前角色给出常用操作（已由菜单权限过滤，这里只做补充） */
export function dashboardShortcuts() {
    if (!USE_MOCK) return request.get({ url: '/hx.dashboard/shortcuts' })
    return delay([
        { title: '新增银行', path: '/hx/basis/bank', roles: ['超级管理员'] },
        { title: '新增支行', path: '/hx/basis/branch', roles: ['超级管理员'] },
        { title: '添加银行经办人', path: '/hx/org/bankAgent', roles: ['总经理', '超级管理员'] },
        { title: '新增经办人账号', path: '/hx/org/agent', roles: ['总经理', '超级管理员'] },
        { title: '客户归属分配', path: '/hx/customer/assign', roles: ['总经理'] },
        { title: '放款记录', path: '/hx/loan/pending/records', roles: ['财务负责人', '总经理', '超级管理员'] }
    ])
}

/** 导出审批节点信息，供工作台提示「顺序不可跳级」使用 */
export function dashboardApprovalRoles(amount: number) {
    return approvalRoles(amount)
}

/** 供工作台展示的支行覆盖情况：已覆盖市州 / 湖南省 14 市州 */
export function dashboardCityCoverage() {
    if (!USE_MOCK) return request.get({ url: '/hx.dashboard/cityCoverage' })
    const cities = Array.from(new Set(branches.map((item) => item.city).filter(Boolean)))
    return delay({
        covered: cities,
        total: 14,
        uncovered: 14 - cities.length
    })
}

/** 支行名称（供工作台明细使用） */
export function dashboardBranchName(id: number) {
    return branchName(id)
}
