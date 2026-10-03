<template>
    <div class="hx-customer">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[200px]" label="客户姓名">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入客户姓名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[220px]" label="手机号">
                    <el-input
                        v-model="formData.mobile"
                        placeholder="请输入手机号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="客户类型">
                    <el-select v-model="formData.customer_type" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="个人" value="person" />
                        <el-option label="企业" value="company" />
                    </el-select>
                </el-form-item>
                <el-form-item class="w-[240px]" label="归属经办人">
                    <el-select v-model="formData.agent_id" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="未分配" :value="0" />
                        <el-option
                            v-for="item in optionsData.agent"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="!isAssign" class="w-[220px]" label="绑定状态">
                    <el-select v-model="formData.bind_status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="已扫码绑定" :value="1" />
                        <el-option label="未绑定" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <div class="flex items-center justify-between mb-3">
                <div class="hx-type-seg">
                    <button
                        type="button"
                        :class="{ active: formData.customer_type === '' }"
                        @click="setType('')"
                    >
                        全部
                    </button>
                    <button
                        type="button"
                        :class="{ active: formData.customer_type === 'person' }"
                        @click="setType('person')"
                    >
                        个人
                    </button>
                    <button
                        type="button"
                        :class="{ active: formData.customer_type === 'company' }"
                        @click="setType('company')"
                    >
                        企业
                    </button>
                </div>
                <span class="text-tx-secondary text-sm">共 {{ pager.count }} 位客户</span>
            </div>
            <div>
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="客户" min-width="170">
                        <template #default="{ row }">
                            <div class="flex items-center gap-2">
                                <el-avatar :size="34" :style="{ background: avatarColor(row) }">
                                    {{ avatarText(row) }}
                                </el-avatar>
                                <div class="min-w-0">
                                    <div class="font-medium truncate">{{ row.name }}</div>
                                    <div
                                        v-if="row.customer_type === 'company'"
                                        class="text-xs text-tx-secondary truncate"
                                    >
                                        {{ row.company || '企业客户' }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="手机号" prop="mobile" min-width="130" />
                    <el-table-column label="客户类型" min-width="100">
                        <template #default="{ row }">
                            <el-tag
                                :type="row.customer_type === 'company' ? 'primary' : 'info'"
                                size="small"
                                effect="light"
                            >
                                {{ row.customer_type_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="企业名称"
                        prop="company"
                        min-width="220"
                        show-tooltip-when-overflow
                    >
                        <template #default="{ row }">
                            {{ row.customer_type === 'person' ? '—' : (row.company || '—') }}
                        </template>
                    </el-table-column>
                    <el-table-column label="归属业务经办人" min-width="140">
                        <template #default="{ row }">
                            <span v-if="row.agent_name">{{ row.agent_name }}</span>
                            <el-tag v-else type="warning" size="small" effect="plain">未分配</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="绑定状态" min-width="120">
                        <template #default="{ row }">
                            <el-tag :type="row.bind_status == 1 ? 'success' : 'info'" size="small">
                                {{ row.bind_status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="注册时间" prop="register_time" min-width="170">
                        <template #default="{ row }">
                            {{ row.register_time || '—' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="业务笔数" prop="business_count" min-width="100" />
                    <el-table-column label="操作" width="210" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleDetail(row)">
                                查看详情
                            </el-button>
                            <!--
                                禁用按钮自身不派发鼠标事件，故把点击处理放在 tooltip 的外层包裹节点上：
                                既可稳定响应点击（给出不可变更的提示），也能保留 hover 提示。
                            -->
                            <el-tooltip
                                :disabled="canAssignRow(row)"
                                :content="assignTip"
                                placement="top"
                            >
                                <span class="hx-op-cell inline-flex" @click="handleAssignCheck(row)">
                                    <el-button type="primary" link :disabled="!canAssignRow(row)">
                                        {{ isAssign ? '指定经办人' : '修改归属' }}
                                    </el-button>
                                </span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <assign-popup
            v-if="showAssign"
            ref="assignRef"
            @success="handleAssignSuccess"
            @close="showAssign = false"
        />
        <detail-drawer
            v-if="showDetail"
            ref="detailRef"
            @assign="handleAssign"
            @close="showDetail = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxCustomer">
import { agentAll } from '@/api/hx/agent'
import { customerLists } from '@/api/hx/customer'
import { HX_ROLE_GM, HX_ROLE_SUPER, currentHxRole } from '@/config/hxRoles'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import AssignPopup from './assign.vue'
import DetailDrawer from './detail.vue'

/**
 * 客户中心 · 一个页面组件承载两个流程节点（P-04）：
 * - mode = list   ：客户列表 —— 查看客户归属业务经办人、客户详情（基础数据 + 历史贷款申请）
 * - mode = assign ：客户归属分配 —— 对未归属客户指定业务经办人（权限归总经理）
 */
const props = withDefaults(defineProps<{ mode?: 'list' | 'assign' }>(), { mode: 'list' })

const isAssign = computed(() => props.mode === 'assign')

const assignRef = shallowRef<InstanceType<typeof AssignPopup>>()
const showAssign = ref(false)
const detailRef = shallowRef<InstanceType<typeof DetailDrawer>>()
const showDetail = ref(false)
const formData = reactive({
    name: '',
    mobile: '',
    customer_type: '',
    // 归属分配节点默认只看未归属客户
    agent_id: isAssign.value ? 0 : ('' as any),
    bind_status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: customerLists,
    params: formData
})

const { optionsData } = useDictOptions<{ agent: any[] }>({
    agent: { api: agentAll }
})

/** 归属变更权限：仅总经理（超级管理员同权）；已归属客户同样支持修改（按需求放开） */
const roleCanAssign = computed(() => [HX_ROLE_GM, HX_ROLE_SUPER].includes(currentHxRole.value))
const canAssignRow = (row: any) => roleCanAssign.value
const assignTip = computed(() => '客户归属变更权限归总经理')

/** 归属校验：仅校验角色权限，点击时给出对应提示 */
const handleAssignCheck = (row: any) => {
    if (!roleCanAssign.value) {
        return feedback.msgWarning('客户归属变更权限归总经理')
    }
    handleAssign(row)
}

const handleAssign = async (row: any) => {
    showAssign.value = true
    await nextTick()
    assignRef.value?.open(row)
}

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

/** 客户头像：取姓名首字；企业=品牌蓝、个人=成功绿（P-04 补充显示） */
const avatarText = (row: any) => (row.name || '客').slice(0, 1)
const avatarColor = (row: any) =>
    row.customer_type === 'company' ? 'var(--el-color-primary)' : 'var(--el-color-success)'
/** 顶部快捷筛选：切换客户类型并刷新列表（与搜索区下拉框共用 formData.customer_type） */
const setType = (type: string) => {
    formData.customer_type = type
    resetPage()
}

/** 归属分配成功后：列表与已打开的详情抽屉同步刷新 */
const handleAssignSuccess = async () => {
    getLists()
    await detailRef.value?.reload()
}

onMounted(() => {
    getLists()
})
</script>

<style lang="scss">
/**
 * 操作栏：禁用态按钮在 Chrome 下不派发（也不冒泡）鼠标事件，导致外层包裹节点的点击、
 * Tooltip 的 hover 提示都无法触发；让禁用按钮 pointer-events: none，事件交由外层 .hx-op-cell 处理。
 */
.hx-op-cell {
    cursor: pointer;

    .el-button.is-disabled {
        pointer-events: none;
    }
}

/** 客户类型快捷分段筛选（顶部，比搜索区下拉更醒目） */
.hx-type-seg {
    display: inline-flex;
    padding: 3px;
    background: var(--el-fill-color-light);
    border-radius: 8px;

    button {
        border: none;
        background: transparent;
        padding: 5px 18px;
        font-size: 13px;
        line-height: 20px;
        border-radius: 6px;
        color: var(--el-text-color-regular);
        cursor: pointer;
        transition: all 0.2s;

        &.active {
            background: var(--el-bg-color);
            color: var(--el-color-primary);
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
    }
}
</style>
