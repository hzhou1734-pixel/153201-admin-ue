<template>
    <div class="agent-picker-popup">
        <popup
            ref="popupRef"
            title="分配业务经办人"
            width="920px"
            :async="true"
            confirm-button-text="确定关联"
            @confirm="handleConfirm"
            @close="handleClose"
        >
            <el-alert
                class="agent-picker-alert mb-4"
                type="info"
                :closable="false"
                show-icon
                title="从业务经办人列表中选择用户关联"
                :description="alertDesc"
            />
            <el-form class="mb-[-16px]" :model="queryParams" inline>
                <el-form-item class="w-[200px]" label="经办人姓名">
                    <el-input
                        v-model="queryParams.name"
                        placeholder="请输入姓名"
                        clearable
                        @keyup.enter="load"
                    />
                </el-form-item>
                <el-form-item class="w-[220px]" label="手机号">
                    <el-input
                        v-model="queryParams.mobile"
                        placeholder="请输入手机号"
                        clearable
                        @keyup.enter="load"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="load">查询</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
            <div class="mt-4">
                <el-table
                    v-loading="loading"
                    :data="lists"
                    size="large"
                    max-height="420"
                    :row-class-name="rowClassName"
                    @row-click="handleRowClick"
                >
                    <el-table-column width="56">
                        <template #default="{ row }">
                            <el-radio v-model="selectedId" :value="row.id" :disabled="row.disabled">
                                <span />
                            </el-radio>
                        </template>
                    </el-table-column>
                    <el-table-column label="经办人姓名" prop="name" min-width="110" />
                    <el-table-column label="手机号" prop="mobile" min-width="140" />
                    <el-table-column label="所属银行" prop="bank_name" min-width="150" />
                    <el-table-column label="当前关联支行" min-width="170">
                        <template #default="{ row }">
                            {{ row.bound_branch_name || '未关联支行' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="选择状态" min-width="170">
                        <template #default="{ row }">
                            <el-tag v-if="row.current" type="success" size="small" effect="plain">
                                当前关联
                            </el-tag>
                            <el-tag v-else-if="row.disabled" type="info" size="small">
                                {{ row.disabled_text }}
                            </el-tag>
                            <el-tag v-else type="success" size="small">可选</el-tag>
                        </template>
                    </el-table-column>
                    <template #empty>
                        <el-empty description="没有可关联的业务经办人" :image-size="80" />
                    </template>
                </el-table>
            </div>
            <div v-if="branch.agent_id" class="flex mt-4 justify-end">
                <el-button type="danger" plain @click="handleUnassign">
                    取消关联「{{ branch.agent_name }}」
                </el-button>
            </div>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { branchAgentOptions, branchAssignAgent } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

/**
 * 业务经办人选择器：为「支行维护 · 分配业务经办人」提供经办人来源。
 * 由支行列表操作栏逐行调起（替代原「前往分配业务经办人」全局按钮）。
 * 仅启用状态的经办人可选；已关联其它支行的置灰不可选。
 */
const emit = defineEmits(['success', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const loading = ref(false)
const lists = ref<any[]>([])
const selectedId = ref<any>('')
const branch = reactive({
    id: '' as any,
    name: '',
    bank_name: '',
    agent_id: 0 as any,
    agent_name: ''
})
const queryParams = reactive({ name: '', mobile: '' })

const alertDesc = computed(
    () => `当前支行：${branch.bank_name || '—'} / ${branch.name || '—'}；灰色行已关联其它支行，不可选择。`
)

const load = async () => {
    loading.value = true
    try {
        lists.value = await branchAgentOptions({ ...queryParams, branch_id: branch.id })
    } finally {
        loading.value = false
    }
}

const resetSearch = () => {
    queryParams.name = ''
    queryParams.mobile = ''
    load()
}

const rowClassName = ({ row }: any) => (row.disabled ? 'agent-picker-row-disabled' : '')

const handleRowClick = (row: any) => {
    if (row.disabled) {
        feedback.msgWarning(row.disabled_text || '该经办人已关联其它支行，不可选择')
        return
    }
    selectedId.value = row.id
}

const handleConfirm = async () => {
    const agent = lists.value.find((item) => item.id == selectedId.value)
    if (!agent) {
        return feedback.msgWarning('请先选择业务经办人')
    }
    if (agent.current) {
        emit('success')
        popupRef.value?.close()
        return feedback.msgSuccess('该经办人已与当前支行关联，无需重复分配')
    }
    await branchAssignAgent({ id: branch.id, agent_id: agent.id })
    // 先派发成功事件（父级列表立即刷新），再关闭弹窗；避免弹窗先卸载导致父级收不到事件
    emit('success')
    popupRef.value?.close()
    feedback.msgSuccess(`已将「${agent.name}」分配为「${branch.name}」的业务经办人`)
}

const handleUnassign = async () => {
    try {
        await feedback.confirm(
            `确认取消「${branch.name}」当前关联的业务经办人「${branch.agent_name}」？取消后该支行可重新分配。`
        )
    } catch (error) {
        return
    }
    await branchAssignAgent({ id: branch.id, agent_id: 0 })
    emit('success')
    popupRef.value?.close()
    feedback.msgSuccess('已取消业务经办人关联')
}

const open = (row: any) => {
    branch.id = row.id
    branch.name = row.name || ''
    branch.bank_name = row.bank_name || ''
    branch.agent_id = row.agent_id || 0
    branch.agent_name = row.agent_name || ''
    queryParams.name = ''
    queryParams.mobile = ''
    selectedId.value = row.agent_id || ''
    popupRef.value?.open()
    load()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss">
/* 弹窗内容 teleport 到 body，scoped 样式无法命中，故使用全局唯一类名 */
.agent-picker-alert {
    align-items: center;

    .el-alert__content {
        flex: 1;
        min-width: 0;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    .el-alert__title,
    .el-alert__description {
        white-space: nowrap;
    }
}

.agent-picker-row-disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
</style>
