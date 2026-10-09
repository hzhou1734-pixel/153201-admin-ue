import type { RouteRecordRaw } from 'vue-router'

import {
    HX_ROLE_CHAIRMAN as CHAIRMAN,
    HX_ROLE_FINANCE as FINANCE,
    HX_ROLE_GM as GM,
    HX_ROLE_RISK as RISK,
    HX_ROLE_SUPER as SUPER,
    currentHxRole
} from '@/config/hxRoles'

/**
 * 红星钱谷业务系统 —— 统一信息架构（菜单 + 权限）
 *
 * 设计原则：
 * 1）业务场景：一级目录 = 数据域 / 业务阶段（贷前 → 贷中 → 贷后 → 基础支撑 → 配置）
 * 2）功能流程：二级菜单 = 该场景下的一个动作节点，一个节点一个独立路由（不再把多块内容塞进同一页）
 * 3）权限拆分：meta.roles 声明该节点可见角色，侧边栏按当前角色过滤；
 *              超级管理员可见全部；放款审批按 P-08 顺序四角色分段可见。
 *
 * 与后台原有模块的融合方式（本文件是唯一数据源）：
 * - 部分节点并入后台已有菜单，避免出现功能重叠的两个同名入口：
 *   · 客户列表 / 客户归属分配 / 银行经办人 / 业务经办人账号  → 并入「用户管理」（用户管理整体提到第二位）
 *   · 系统对接（云存储/短信/E签宝/小程序）、角色管理、管理员管理 → 并入「系统设置」
 *   合并规则由 meta.hostTitle / meta.hostInsert / meta.hostMoveTo 描述，由 sidebar/side.vue 执行。
 * - 其余业务节点（审核中心 / 放款管理 / 回款管理 / 基础数据）作为业务域主导航，
 *   插入到「工作台」之后，与后台原有菜单共同组成一个整体。
 *
 * 注意：并入后台菜单的子节点必须使用「绝对路径」，否则侧边栏拼接父级 path 时会得到
 *      /user/hx/customer/list 这类不存在的地址（menu-item.vue 的 resolvePath 已支持绝对路径）。
 */

/** 场景（一级目录）元信息：业务场景 + 流程阶段，供总览页与权限矩阵使用 */
export interface HxSceneMeta {
    /** 业务场景名（与侧边栏一级目录一致） */
    scene: string
    /** 流程阶段 */
    stage: string
    /** 场景说明 */
    desc: string
}

export const HX_SCENES: Record<string, HxSceneMeta> = {
    dashboard: {
        scene: '工作台',
        stage: '总览 · 业务数据统计',
        desc: '系统基础业务数据统计总览：客户 / 业务 / 放款 / 回款 / 机构五大域的核心指标、按角色拆分的待办事项与趋势分布。'
    },
    user: {
        scene: '用户管理',
        stage: '贷前 · 获客与归属 · 账号',
        desc: '并入后台原有「用户管理」菜单。承载客户信息与归属关系（客户列表 / 客户归属分配），以及银行经办人、业务经办人账号两类账号的维护——账号均通过「选择平台注册用户」开通经办人权限。'
    },
    customer: {
        scene: '用户管理',
        stage: '贷前 · 获客与归属',
        desc: '客户信息与归属关系管理。客户扫码注册后自动绑定业务经办人；未绑定客户由总经理指定归属。'
    },
    audit: {
        scene: '审核中心',
        stage: '贷中 · 业务审核',
        desc: '业务材料审核（归风控负责人）。经办人账号不再走认证审核：银行经办人 / 业务经办人账号统一由后台「选择平台注册用户」直接开通权限。'
    },
    loan: {
        scene: '放款管理',
        stage: '贷中 · 审批与放款',
        desc: '客户签约完成后进入放款审批；顺序固定不可跳级；财务线下放款后在此登记状态。'
    },
    repayment: {
        scene: '回款管理',
        stage: '贷后 · 回款与归档',
        desc: '业务经办人上传回款凭证，财务核对确认或驳回重传；此环节不影响放款。'
    },
    basis: {
        scene: '基础数据',
        stage: '支撑 · 机构维护',
        desc: '银行 / 支行两级机构数据维护，支行归属限定湖南省 14 个市州，同一支行仅配置一个经办人账号。'
    },
    setting: {
        scene: '系统设置',
        stage: '配置 · 系统参数 · 权限',
        desc: '并入后台原有「系统设置」菜单。网站信息、登录页等平台基础配置；并补充角色管理与管理员管理（角色可逐项分配各功能板块的权限颗粒度）。'
    },
    system: {
        scene: '系统设置',
        stage: '配置 · 三方对接',
        desc: '云存储、短信（四类场景）、E签宝（人脸认证 + 签约 + 结果回传）、小程序四类对接配置。'
    }
}

/** 客户节点：并入后台「用户管理」菜单（绝对路径） */
const hxUserChildren: RouteRecordRaw[] = [
    {
        path: '/hx/customer/list',
        name: 'HxMenuCustomerList',
        meta: { title: '客户列表', icon: 'el-icon-List', roles: [GM, RISK, FINANCE] }
    },
    {
        path: '/hx/customer/assign',
        name: 'HxMenuCustomerAssign',
        meta: { title: '客户归属分配', icon: 'el-icon-Connection', roles: [GM] }
    },
    {
        path: '/hx/org/bankAgent',
        name: 'HxMenuOrgBankAgent',
        meta: { title: '银行经办人', icon: 'el-icon-Briefcase', roles: [GM, SUPER] }
    },
    {
        path: '/hx/org/agent',
        name: 'HxMenuOrgAgent',
        meta: { title: '业务经办人账号', icon: 'el-icon-User', roles: [GM, SUPER] }
    }
]

/**
 * 三方对接分组：并入后台「系统设置」菜单，作为其下第二个路由
 * 注意：其下子项为三级菜单，按统一规范**不配左侧图标**（由 normalizeMenuIcons 强制清空）
 */
const hxSystemGroup: RouteRecordRaw = {
    path: '/hx/system',
    name: 'HxMenuSystem',
    meta: { title: '系统对接', icon: 'el-icon-Link' },
    children: [
        {
            path: 'storage',
            name: 'HxMenuSystemStorage',
            meta: { title: '云存储对接', roles: [SUPER] }
        },
        {
            path: 'sms',
            name: 'HxMenuSystemSms',
            meta: { title: '短信对接', roles: [SUPER] }
        },
        {
            path: 'esign',
            name: 'HxMenuSystemEsign',
            meta: { title: 'E签宝对接', roles: [SUPER] }
        },
        {
            path: 'weapp',
            name: 'HxMenuSystemWeapp',
            meta: { title: '小程序对接', roles: [SUPER] }
        }
    ]
}

/** 系统设置 · 角色管理（超级管理员可见）：角色列表 + 逐项分配各功能板块的权限颗粒度 */
const HxMenuSystemRole: RouteRecordRaw = {
    path: '/hx/system/role',
    name: 'HxMenuSystemRole',
    meta: { title: '角色管理', icon: 'el-icon-Key', roles: [SUPER] }
}

/** 系统设置 · 管理员管理（超级管理员可见）：后台管理员账号的创建、停启用与角色绑定 */
const HxMenuSystemAdmin: RouteRecordRaw = {
    path: '/hx/system/admin',
    name: 'HxMenuSystemAdmin',
    meta: { title: '管理员管理', icon: 'el-icon-UserFilled', roles: [SUPER] }
}

/**
 * 全部业务节点（唯一数据源）
 * - meta.hostTitle：并入后台同名的已有菜单（命中则不再单独渲染本组）
 * - meta.hostInsert：插入到宿主菜单 children 的位置；'append' 追加到末尾、数字为下标
 * - meta.hostMoveTo：宿主菜单整体在一级菜单中的目标位置（仅用户管理需要提到第二位）
 */
export const hxMenus: RouteRecordRaw[] = [
    {
        // 工作台：侧边栏最顶部（pinTop），全角色可见，展示系统基础业务数据统计
        path: '/hx/dashboard',
        name: 'HxMenuDashboard',
        meta: { title: '工作台', icon: 'el-icon-Odometer', pinTop: true }
    },
    {
        path: '/hx/user',
        name: 'HxMenuUserHost',
        meta: {
            title: '用户管理',
            icon: 'el-icon-UserFilled',
            hostTitle: '用户管理',
            hostInsert: 'append',
            hostMoveTo: 1
        },
        children: hxUserChildren
    },
    {
        path: '/hx/audit',
        name: 'HxMenuAudit',
        meta: { title: '审核中心', icon: 'el-icon-DocumentChecked' },
        children: [
            {
                path: 'business',
                name: 'HxMenuAuditBusiness',
                meta: { title: '风控初审', icon: 'el-icon-Document', roles: [RISK] }
            }
        ]
    },
    {
        path: '/hx/loan',
        name: 'HxMenuLoan',
        meta: { title: '放款管理', icon: 'el-icon-Money' },
        children: [
            {
                path: 'approval',
                name: 'HxMenuLoanApproval',
                meta: { title: '放款审批', icon: 'el-icon-Finished', roles: [RISK, FINANCE, GM, CHAIRMAN] }
            },
            {
                path: 'pending/records',
                name: 'HxMenuLoanPendingRecords',
                meta: { title: '放款记录', icon: 'el-icon-Wallet', roles: [FINANCE, GM, CHAIRMAN] }
            }
        ]
    },
    {
        path: '/hx/repayment',
        name: 'HxMenuRepayment',
        meta: { title: '回款管理', icon: 'el-icon-Coin' },
        children: [
            {
                path: 'pending',
                name: 'HxMenuRepaymentPending',
                meta: { title: '待确认凭证', icon: 'el-icon-PictureRounded', roles: [FINANCE] }
            },
            {
                path: 'records',
                name: 'HxMenuRepaymentRecords',
                meta: { title: '回款记录', icon: 'el-icon-FolderOpened', roles: [FINANCE, GM] }
            }
        ]
    },
    {
        path: '/hx/basis',
        name: 'HxMenuBasis',
        meta: { title: '基础数据', icon: 'el-icon-OfficeBuilding' },
        children: [
            {
                path: 'bank',
                name: 'HxMenuBasisBank',
                meta: { title: '银行维护', icon: 'el-icon-CreditCard', roles: [SUPER] }
            },
            {
                path: 'branch',
                name: 'HxMenuBasisBranch',
                meta: {
                    title: '支行维护',
                    icon: 'el-icon-LocationInformation',
                    roles: [SUPER]
                }
            }
        ]
    },
    {
        path: '/hx/setting',
        name: 'HxMenuSettingHost',
        meta: {
            title: '系统设置',
            icon: 'el-icon-Setting',
            hostTitle: '系统设置',
            hostInsert: 1
        },
        children: [HxMenuSystemRole, HxMenuSystemAdmin, hxSystemGroup]
    }
]

/** 判断某菜单节点是否为「并入后台已有菜单」的宿主包装节点 */
export function isHxHostMenu(menu: any): boolean {
    return !!menu?.meta?.hostTitle
}

/** 判断某角色是否可见某菜单节点（未声明 roles 视为全部角色可见） */
export function menuVisibleForRole(menu: any, role: string): boolean {
    if (role === SUPER) return true
    const roles: string[] | undefined = menu?.meta?.roles
    if (!roles || !roles.length) return true
    return roles.includes(role)
}

/**
 * 按角色过滤菜单树：子项全不可见的目录直接隐藏。
 * 例外：宿主包装节点（meta.hostTitle）即使当前角色下没有可见子项也保留，
 * 因为它声明的是「宿主菜单的注入位置与排序」，与子项可见性无关（例如董事长看不到客户节点，
 * 但后台原有「用户管理」仍应保持在第二位）。
 */
export function filterHxMenusByRole(menus: any[], role: string): any[] {
    const result: any[] = []
    menus.forEach((menu) => {
        if (menu.children?.length) {
            const children = filterHxMenusByRole(menu.children, role)
            if (children.length || menu.meta?.hostTitle) {
                result.push({ ...menu, children })
            }
            return
        }
        if (menuVisibleForRole(menu, role)) {
            result.push(menu)
        }
    })
    return result
}

/** 取当前角色过滤后的菜单（依赖 currentHxRole 响应式状态） */
export function getHxMenusByCurrentRole(): any[] {
    return filterHxMenusByRole(hxMenus as any[], currentHxRole.value)
}

/** 展平菜单树，得到「场景 - 节点 - 路由 - 可见角色」清单（总览页与权限矩阵使用） */
export interface HxMenuFlatItem {
    scene: string
    stage: string
    title: string
    path: string
    roles: string[]
}

/** 由路由地址反查所属业务场景：逐级向上匹配 HX_SCENES 的 key */
function resolveSceneMeta(path: string): HxSceneMeta | undefined {
    const segments = (path || '').replace('/hx/', '').split('/').filter(Boolean)
    for (let n = segments.length; n >= 1; n--) {
        const meta = HX_SCENES[segments.slice(0, n).join('/')]
        if (meta) return meta
    }
    return undefined
}

export function flattenHxMenus(
    menus: any[] = hxMenus as any[],
    scene = '',
    parentPath = ''
): HxMenuFlatItem[] {
    const list: HxMenuFlatItem[] = []
    menus.forEach((menu) => {
        const title = menu.meta?.title || ''
        // 拼出完整路由地址：子项为相对路径时与父级目录拼接（并入后台菜单的节点用绝对路径）
        const fullPath = (menu.path || '').startsWith('/')
            ? menu.path
            : `${parentPath}/${menu.path}`.replace(/\/+/g, '/')
        // 宿主包装节点（用户管理 / 系统设置）本身不是页面，只声明注入位置与排序，不产出节点行
        if (menu.meta?.hostTitle) {
            list.push(...flattenHxMenus(menu.children || [], scene, fullPath))
            return
        }
        const sceneMeta = resolveSceneMeta(fullPath)
        if (menu.children?.length) {
            list.push(...flattenHxMenus(menu.children, sceneMeta ? sceneMeta.scene : title, fullPath))
            return
        }
        list.push({
            scene: sceneMeta?.scene || scene || '',
            stage: sceneMeta?.stage || '',
            title,
            path: fullPath,
            roles: menu.meta?.roles || []
        })
    })
    return list
}
