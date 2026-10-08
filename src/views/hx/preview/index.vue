<template>
    <div class="hx-overview">
        <el-card class="!border-none" shadow="never">
            <el-alert
                type="success"
                :closable="false"
                show-icon
                title="红星钱谷业务系统 · 信息架构总览"
                description="本页为后端菜单配置前的验收地图：按「业务场景 / 功能流程 / 权限拆分」三个维度组织的完整菜单结构，并与后台原有模块合并为一个整体。点击节点可直接进入对应页面。"
            />
            <div class="mt-4 flex items-center flex-wrap">
                <span class="mr-3 text-tx-secondary">当前角色视角：</span>
                <el-radio-group v-model="role" @change="handleRoleChange">
                    <el-radio-button v-for="item in roleList" :key="item" :value="item">
                        {{ item }}
                    </el-radio-button>
                </el-radio-group>
                <el-tag class="ml-4" size="small" type="warning" effect="plain">
                    当前可见 {{ visibleCount }} / {{ totalCount }} 个功能节点
                </el-tag>
                <span class="ml-4 text-tx-secondary text-sm">
                    切换后左侧菜单同步过滤，放款审批待办也按角色收敛
                </span>
            </div>
        </el-card>

        <!-- 三个拆分维度 -->
        <el-row :gutter="16" class="mt-4">
            <el-col v-for="item in dimensions" :key="item.title" :span="8">
                <el-card class="!border-none h-full" shadow="never">
                    <div class="font-medium">
                        <icon class="mr-1" :name="item.icon" />
                        {{ item.title }}
                    </div>
                    <div class="text-tx-secondary text-sm mt-2 leading-6">{{ item.desc }}</div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 场景 → 流程节点 -->
        <el-card class="mt-4 !border-none" shadow="never">
            <template #header>
                <div class="font-medium">功能地图：业务场景 → 流程节点（一级菜单 → 二级菜单）</div>
            </template>
            <el-row :gutter="16">
                <el-col v-for="scene in scenes" :key="scene.scene" :span="8" class="mb-4">
                    <div class="border border-solid border-[#ebeef5] rounded-md h-full">
                        <div class="px-3 py-2 border-b border-solid border-[#ebeef5] bg-[rgba(64,158,255,0.04)]">
                            <div class="font-medium">{{ scene.scene }}</div>
                            <div class="text-tx-secondary text-xs mt-1">{{ scene.stage }}</div>
                        </div>
                        <div class="p-3">
                            <div
                                v-for="node in scene.nodes"
                                :key="node.path"
                                class="py-2 border-b border-solid border-[#ebeef5] last:border-none"
                                :class="node.visible ? 'cursor-pointer hover:text-primary' : 'opacity-50'"
                                @click="go(node)"
                            >
                                <div class="flex justify-between items-center">
                                    <span>{{ node.title }}</span>
                                    <icon v-if="node.visible" name="el-icon-ArrowRight" />
                                    <el-tag v-else size="small" type="info" effect="plain">
                                        当前角色不可见
                                    </el-tag>
                                </div>
                                <div class="text-tx-secondary text-xs mt-1">
                                    {{ node.roles.length ? node.roles.join(' / ') : '全部角色' }}
                                    <span class="ml-2">· {{ node.flow }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </el-card>

        <!-- 新老模块融合 -->
        <el-card class="mt-4 !border-none" shadow="never">
            <template #header>
                <div class="font-medium">新老模块融合：后台原有模块与需求文档的对应关系</div>
            </template>
            <el-table :data="mergeList" size="small">
                <el-table-column label="模块" prop="module" min-width="150" />
                <el-table-column label="归属域" prop="domain" min-width="140" />
                <el-table-column label="在整体架构中的角色" prop="relation" min-width="420" />
                <el-table-column label="入口" min-width="160">
                    <template #default="{ row }">
                        <el-link
                            v-if="row.path"
                            type="primary"
                            :underline="false"
                            @click="go({ path: row.path, visible: true })"
                        >
                            {{ row.path }}
                        </el-link>
                        <span v-else class="text-tx-secondary">后端菜单下发</span>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="hxOverview">
import { HX_ROLES, applyHxRole, currentHxRole } from '@/config/hxRoles'
import { flattenHxMenus, hxMenus, menuVisibleForRole } from '@/router/hxMenus'
import feedback from '@/utils/feedback'

/** 流程节点在业务链路上的位置说明 */
const NODE_FLOW: Record<string, string> = {
    '/hx/dashboard': '总览 · 全局',
    '/hx/customer/list': '贷前 · 第 1 步',
    '/hx/customer/assign': '贷前 · 第 2 步',
    '/hx/audit/business': '贷中 · 第 1 步',
    '/hx/audit/agentAuth': '用户 · 认证审核',
    '/hx/loan/approval': '贷中 · 第 2 步',
    '/hx/loan/pending/records': '贷中 · 第 3 步（放款登记）',
    '/hx/repayment/pending': '贷后 · 第 1 步',
    '/hx/repayment/records': '贷后 · 第 1 步（归档）',
    '/hx/basis/bank': '支撑 · 机构',
    '/hx/basis/branch': '支撑 · 机构',
    '/hx/org/bankAgent': '用户 · 账号',
    '/hx/org/agent': '用户 · 账号',
    '/hx/system/role': '配置 · 权限',
    '/hx/system/admin': '配置 · 账号',
    '/hx/system/storage': '配置 · 对接',
    '/hx/system/sms': '配置 · 对接',
    '/hx/system/esign': '配置 · 对接',
    '/hx/system/weapp': '配置 · 对接'
}

const roleList = HX_ROLES
const role = ref(currentHxRole.value)

const dimensions = [
    {
        icon: 'el-icon-Grid',
        title: '维度一 · 业务场景',
        desc: '一级菜单按数据域与业务阶段划分，并与后台原有菜单合并为一个整体：用户管理（贷前获客 + 银行经办人 / 业务经办人账号，已并入原有「用户管理」）→ 审核中心（业务审核 + 经办人认证审核）→ 放款管理（贷中）→ 回款管理（贷后）→ 基础数据（支撑）→ 系统设置（并入原有「系统设置」，含角色管理 / 管理员管理 / 三方对接）。'
    },
    {
        icon: 'el-icon-Sort',
        title: '维度二 · 功能流程',
        desc: '二级菜单即流程节点，一个节点一个独立路由：获客归属 → 准入认证 → 材料审核 → 放款审批 → 放款登记 → 回款确认，每个节点只承载本环节内容，避免多块内容堆在同一路由。'
    },
    {
        icon: 'el-icon-Lock',
        title: '维度三 · 权限拆分',
        desc: '菜单可见性与操作权限按角色拆分：风控（认证/业务审核）、财务（放款登记/回款确认）、总经理、董事长（大额终审）、管理员（机构/账号/对接配置）；放款审批按顺序分段授权，不可越权跳级。'
    }
]

/** 场景 → 流程节点：由菜单树展平得到，自动兼容「并入后台菜单」的节点与嵌套分组 */
const scenes = computed(() => {
    const list: any[] = []
    const index = new Map<string, any>()
    flattenHxMenus(hxMenus as any[]).forEach((node) => {
        const scene = node.scene || '未分组'
        if (!index.has(scene)) {
            const entry = { scene, stage: node.stage || '', nodes: [] as any[] }
            index.set(scene, entry)
            list.push(entry)
        }
        const entry = index.get(scene)
        if (!entry.stage && node.stage) entry.stage = node.stage
        entry.nodes.push({
            title: node.title,
            path: node.path,
            roles: node.roles,
            flow: NODE_FLOW[node.path] || '',
            visible: menuVisibleForRole({ meta: { roles: node.roles } }, currentHxRole.value)
        })
    })
    return list
})

const totalCount = computed(() =>
    scenes.value.reduce((total: number, scene: any) => total + scene.nodes.length, 0)
)
const visibleCount = computed(() =>
    scenes.value.reduce(
        (total: number, scene: any) => total + scene.nodes.filter((n: any) => n.visible).length,
        0
    )
)

/** 后台原有模块与需求文档的融合关系 */
const mergeList = [
    {
        module: '工作台',
        domain: '融合模块（业务数据总览）',
        relation: '★ 侧边栏最顶部。统计本系统基础业务数据：客户/业务/放款/回款五大域核心指标、按角色拆分的待办事项、业务状态与地域分布、经办人业绩与操作动态。登录后的首个落地页，排序第 1 位',
        path: '/hx/dashboard'
    },
    {
        module: '用户管理',
        domain: '融合模块（客户中心并入）',
        relation: 'P-12 角色权限体系的管理员侧账号管理（原有）+ P-04 客户归属：客户列表（查看归属）、客户归属分配（未绑定客户指定经办人，权限归总经理）并入本菜单，整体提到第 2 位；同时承载银行经办人与业务经办人账号两类后台账号的维护',
        path: '/hx/customer/list'
    },
    {
        module: '权限管理',
        domain: '系统域（原有）',
        relation: 'P-12 角色权限与菜单权限配置；本项目在该页配置角色后，业务菜单按角色过滤可见',
        path: ''
    },
    {
        module: '系统设置',
        domain: '融合模块（系统对接并入）',
        relation: '网站信息、登录页等平台配置（原有）+ 角色管理（按功能板块 × 操作逐项分配权限颗粒度）、管理员管理（后台账号创建与角色绑定）+ P-11 三方对接：云存储、短信（四类场景）、E签宝、小程序，作为系统设置下的分组',
        path: '/hx/system/role'
    },
    {
        module: '审核中心',
        domain: '业务域（本项目）',
        relation: 'P-06 / P-07 业务审核：风控初审（材料查看与下载、审批操作；「审核记录（留痕）」节点已删除，与「审批留痕」重复）；P-05 经办人认证审核：银行经办人账号由用户在客户端 / 小程序提交认证申请，后台审核通过后该用户自动成为对应银行的银行经办人（账号不由后台直接添加）',
        path: '/hx/audit/business'
    },
    {
        module: '放款管理',
        domain: '业务域（本项目）',
        relation: 'P-08 放款审批（待我审批，顺序固定不可跳级，按角色拆分）+ P-09 放款登记（放款记录，内置「添加放款」入口从审批通过记录中选择确认放款）；「审批留痕」独立页面已删除，节点操作人/时间改为内嵌于「风控初审」「放款审批」详情的「流程节点记录（全链路）」',
        path: '/hx/loan/approval'
    },
    {
        module: '回款管理',
        domain: '业务域（本项目）',
        relation: 'P-10 回款凭证确认：待确认凭证（财务操作）与回款记录（归档）拆为两个节点',
        path: '/hx/repayment/pending'
    },
    {
        module: '基础数据',
        domain: '支撑域（本项目）',
        relation: 'P-03 银行 / 支行两级机构维护，支行归属限定湖南 14 市州，同一支行仅一个经办人账号；业务经办人分配下移到支行列表操作栏（原「前往分配业务经办人」全局按钮已删除），逐行从业务经办人列表选择用户关联',
        path: '/hx/basis/bank'
    },
    {
        module: '用户与账号',
        domain: '用户域（本项目）',
        relation: 'P-02 银行经办人（由「经办人认证审核」通过后自动生成，本页仅查看 / 编辑 / 停用 / 移除）、业务经办人账号的创建与停启用；已从原「账号与权限」独立一级菜单迁移至「用户管理」下，与原有「权限管理」共同构成账号体系',
        path: '/hx/org/bankAgent'
    }
]

const go = (node: any) => {
    if (!node?.path || node.visible === false) return
    router.push(node.path)
}

const handleRoleChange = () => {
    applyHxRole(role.value)
    nextTick(() => {
        feedback.msgSuccess(
            `已切换为「${role.value}」，可见 ${visibleCount.value} / ${totalCount.value} 个功能节点，左侧菜单已同步过滤`
        )
    })
}

onMounted(() => {
    feedback.msg('当前为本地 Mock 数据演示环境，操作会实时影响列表状态')
})
</script>
