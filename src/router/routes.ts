/**
 * Note: 路由配置项
 *
 * path: '/path'                    // 路由路径
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * meta : {
	title: 'title'                  // 设置该路由在侧边栏的名字
	icon: 'icon-name'                // 设置该路由的图标
	activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
	query: '{"id": 1}'             // 访问路由的默认传递参数
	hidden: true                   // 当设置 true 的时候该路由不会在侧边栏出现 
    hideTab: true                   //当设置 true 的时候该路由不会在多标签tab栏出现
  }
 */

import type { RouteRecordRaw } from 'vue-router'

import { PageEnum } from '@/enums/pageEnum'
import Layout from '@/layout/default/index.vue'

export const LAYOUT = () => Promise.resolve(Layout)

export const INDEX_ROUTE_NAME = Symbol()

export const constantRoutes: Array<RouteRecordRaw> = [
    {
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/error/404.vue')
    },
    {
        path: PageEnum.ERROR_403,
        component: () => import('@/views/error/403.vue')
    },
    {
        path: PageEnum.LOGIN,
        component: () => import('@/views/account/login.vue')
    },
    {
        path: '/user',
        component: LAYOUT,
        children: [
            {
                path: 'setting',
                component: () => import('@/views/user/setting.vue'),
                name: Symbol(),
                meta: {
                    title: '个人设置'
                }
            }
        ]
    },
    {
        path: '/decoration/pc_details',
        component: () => import('@/views/decoration/pc_details.vue')
    },
    /**
     * 红星钱谷业务系统 —— 业务路由（本地静态挂载，按「业务场景 → 功能流程节点」拆分）
     *
     * 一个流程节点 = 一个独立路由 = 侧边栏一个二级菜单（见 src/router/hxMenus.ts）。
     * 同一页面组件在不同节点下通过 props 区分职责范围（如客户列表 / 客户归属分配）。
     * 正式环境：后端「系统菜单」下发后动态注册，删除本段即可。
     */
    {
        path: '/hx',
        component: LAYOUT,
        redirect: '/hx/preview',
        children: [
            // 工作台 · 系统基础业务数据统计（侧边栏最顶部）
            {
                path: 'dashboard',
                name: 'HxDashboard',
                component: () => import('@/views/hx/dashboard/index.vue'),
                meta: { title: '工作台' }
            },

            // 信息架构总览（验收入口）
            {
                path: 'preview',
                name: 'HxPreview',
                component: () => import('@/views/hx/preview/index.vue'),
                meta: { title: '信息架构总览' }
            },

            // 客户中心 · 贷前获客与归属
            {
                path: 'customer/list',
                name: 'HxCustomerList',
                component: () => import('@/views/hx/customer/index.vue'),
                props: { mode: 'list' },
                meta: { title: '客户列表' }
            },
            {
                path: 'customer/assign',
                name: 'HxCustomerAssign',
                component: () => import('@/views/hx/customer/index.vue'),
                props: { mode: 'assign' },
                meta: { title: '客户归属分配' }
            },

            // 审核中心 · 业务审核（经办人认证审核已下线：经办人账号改为后台选择用户开通权限）
            {
                path: 'audit/business',
                name: 'HxAuditBusiness',
                component: () => import('@/views/hx/businessAudit/index.vue'),
                props: { mode: 'pending' },
                meta: { title: '风控初审' }
            },
            // 放款管理 · 审批与放款登记
            {
                path: 'loan/approval',
                name: 'HxLoanApproval',
                component: () => import('@/views/hx/loanApproval/index.vue'),
                props: { mode: 'todo' },
                meta: { title: '放款审批' }
            },
            {
                path: 'loan/pending/records',
                name: 'HxLoanPendingRecords',
                component: () => import('@/views/hx/loanPending/index.vue'),
                props: { mode: 'records' },
                meta: { title: '放款记录' }
            },

            // 回款管理 · 贷后
            {
                path: 'repayment/pending',
                name: 'HxRepaymentPending',
                component: () => import('@/views/hx/repayment/index.vue'),
                props: { mode: 'pending' },
                meta: { title: '待确认凭证' }
            },
            {
                path: 'repayment/records',
                name: 'HxRepaymentRecords',
                component: () => import('@/views/hx/repayment/index.vue'),
                props: { mode: 'records' },
                meta: { title: '回款记录' }
            },

            // 基础数据 · 机构维护
            {
                path: 'basis/bank',
                name: 'HxBasisBank',
                component: () => import('@/views/hx/bank/index.vue'),
                meta: { title: '银行维护' }
            },
            {
                path: 'basis/branch',
                name: 'HxBasisBranch',
                component: () => import('@/views/hx/branch/index.vue'),
                meta: { title: '支行维护' }
            },

            // 账号与权限 · 账号体系（银行经办人 / 业务经办人账号已并入「用户管理」，见下方 user 宿主注入）
            {
                path: 'org/bankAgent',
                name: 'HxOrgBankAgent',
                component: () => import('@/views/hx/bankAgent/index.vue'),
                meta: { title: '银行经办人' }
            },
            {
                path: 'org/agent',
                name: 'HxOrgAgent',
                component: () => import('@/views/hx/agent/index.vue'),
                props: { mode: 'account' },
                meta: { title: '业务经办人账号' }
            },

            // 系统设置 · 角色与管理员（并入「系统设置」宿主）
            {
                path: 'system/role',
                name: 'HxSystemRole',
                component: () => import('@/views/hx/role/index.vue'),
                meta: { title: '角色管理' }
            },
            {
                path: 'system/admin',
                name: 'HxSystemAdmin',
                component: () => import('@/views/hx/admin/index.vue'),
                meta: { title: '管理员管理' }
            },

            // 系统对接 · 三方配置（并入「系统设置」宿主）
            {
                path: 'system/storage',
                name: 'HxSystemStorage',
                component: () => import('@/views/hx/thirdParty/index.vue'),
                props: { tab: 'storage' },
                meta: { title: '云存储对接' }
            },
            {
                path: 'system/sms',
                name: 'HxSystemSms',
                component: () => import('@/views/hx/thirdParty/index.vue'),
                props: { tab: 'sms' },
                meta: { title: '短信对接' }
            },
            {
                path: 'system/esign',
                name: 'HxSystemEsign',
                component: () => import('@/views/hx/thirdParty/index.vue'),
                props: { tab: 'esign' },
                meta: { title: 'E签宝对接' }
            },
            {
                path: 'system/weapp',
                name: 'HxSystemWeapp',
                component: () => import('@/views/hx/thirdParty/index.vue'),
                props: { tab: 'weapp' },
                meta: { title: '小程序对接' }
            }
        ]
    },

    // {
    //     path: '/dev_tools',
    //     component: LAYOUT,
    //     children: [
    //         {
    //             path: 'code/edit',
    //             component: () => import('@/views/dev_tools/code/edit.vue'),
    //             meta: {
    //                 title: '编辑数据表',
    //                 activeMenu: '/dev_tools/code'
    //             }
    //         }
    //     ]
    // },
    // {
    //     path: '/setting',
    //     component: LAYOUT,
    //     children: [
    //         {
    //             path: 'dict/data',
    //             component: () => import('@/views/setting/dict/data/index.vue'),
    //             meta: {
    //                 title: '数据管理',
    //                 activeMenu: '/setting/dict'
    //             }
    //         }
    //     ]
    // }
]

export const INDEX_ROUTE: RouteRecordRaw = {
    path: PageEnum.INDEX,
    component: LAYOUT,
    name: INDEX_ROUTE_NAME
}
