<template>
    <div class="loan-detail">
        <popup
            ref="popupRef"
            title="放款审批详情"
            :confirm-button-text="false"
            cancel-button-text="关闭"
            width="860px"
            @close="handleClose"
        >
            <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="业务编号">{{ detail.sn }}</el-descriptions-item>
                <el-descriptions-item label="客户姓名">{{ detail.customer_name }}</el-descriptions-item>
                <el-descriptions-item label="放款金额">
                    ¥{{ formatterAmount(detail.amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="所属银行">{{ detail.bank_name }}</el-descriptions-item>
                <el-descriptions-item label="所属支行">{{ detail.branch_name }}</el-descriptions-item>
                <el-descriptions-item label="业务经办人">{{ detail.agent_name }}</el-descriptions-item>
                <el-descriptions-item label="签约完成时间" :span="2">
                    {{ detail.sign_time }}
                </el-descriptions-item>
                <el-descriptions-item label="审批状态">
                    <el-tag
                        :type="
                            detail.status == 'approved'
                                ? 'success'
                                : detail.status == 'rejected'
                                  ? 'danger'
                                  : 'warning'
                        "
                        size="small"
                    >
                        {{ detail.status_text }}
                    </el-tag>
                </el-descriptions-item>
            </el-descriptions>

            <div class="mt-5">
                <el-steps
                    :active="activeStep"
                    :process-status="detail.status == 'rejected' ? 'error' : 'process'"
                    align-center
                    finish-status="success"
                >
                    <el-step
                        v-for="(node, index) in detail.nodes"
                        :key="index"
                        :title="node.role"
                        :status="stepStatus(node)"
                    >
                        <template #description>
                            <div class="text-xs leading-5">
                                <div v-if="node.user">{{ node.user }}</div>
                                <div v-if="node.time">{{ node.time }}</div>
                                <div v-if="node.remark" class="text-tx-secondary">
                                    {{ node.remark }}
                                </div>
                                <div v-if="node.status == -1">待流转</div>
                            </div>
                        </template>
                    </el-step>
                </el-steps>
            </div>

            <div class="mt-5">
                <div class="mb-3 font-medium">流程节点记录（全链路）</div>
                <ul class="hx-flow">
                    <li v-for="(n, i) in flow" :key="i" class="hx-flow-item">
                        <span class="hx-flow-dot" :class="`is-${n.status}`"></span>
                        <div class="hx-flow-body">
                            <div class="flex items-center justify-between">
                                <span class="font-medium">{{ n.name }}</span>
                                <span class="text-xs" :class="statusClass(n.status)">{{ statusText(n.status) }}</span>
                            </div>
                            <div v-if="n.operator || n.time" class="text-sm text-tx-secondary mt-1">
                                <template v-if="n.operator">操作人：{{ n.operator }}</template>
                                <template v-if="n.time"><span class="ml-3">时间：{{ n.time }}</span></template>
                            </div>
                            <div v-if="n.note" class="text-xs text-[#f56c6c] mt-1">{{ n.note }}</div>
                        </div>
                    </li>
                </ul>
            </div>

            <div v-if="canApprove" class="mt-5">
                <el-divider content-position="left">审批操作</el-divider>
                <el-alert
                    class="mb-4"
                    type="warning"
                    :closable="false"
                    show-icon
                    :title="`当前节点：${detail.current_node}（第 ${detail.current_index + 1}/${detail.node_total} 级）`"
                    description="顺序固定不可跳级，仅当前节点角色可操作；驳回后后续角色无需审核。"
                />
                <el-alert
                    class="mb-4"
                    type="warning"
                    :closable="false"
                    show-icon
                    title="审批操作影响"
                    description="通过：业务流转至下一审批节点；若为最后一级，则进入「确认放款」环节，客户端状态「审批中」→「放款中」。驳回：审批终止，后续节点无需处理，客户端业务显示「已驳回」，驳回理由必填。"
                />
                <el-form :model="formData" label-width="90px">
                    <el-form-item label="操作人">
                        <el-input v-model="formData.user" placeholder="请输入操作人姓名" />
                    </el-form-item>
                    <el-form-item label="审批结果">
                        <el-radio-group v-model="formData.result">
                            <el-radio :value="1">通过</el-radio>
                            <el-radio :value="0">驳回</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="审批意见">
                        <el-input
                            v-model="formData.remark"
                            type="textarea"
                            :rows="3"
                            maxlength="200"
                            show-word-limit
                            :placeholder="formData.result == 0 ? '驳回必须填写审批意见' : '请输入审批意见（选填）'"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :loading="submitting" @click="handleSubmit">
                            提交审批
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { loanApprove, loanDetail } from '@/api/hx/loan'
import { currentRole } from '@/api/hx/mock'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

const emit = defineEmits(['success', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const detail = ref<any>({})
const submitting = ref(false)
const formData = reactive({ user: '', result: 1, remark: '' })

const canApprove = computed(
    () =>
        detail.value.status == 'pending' &&
        detail.value.current_node &&
        detail.value.current_node == currentRole()
)

/**
 * 流程节点记录（全链路）：提交业务 → 业务审核 → 放款审核（多级）→ 确认放款。
 * 每个节点记录操作人与操作时间，替代原「审批留痕」独立页面。
 */
const flow = computed(() => {
    const d = detail.value
    const list: any[] = []
    if (d.submit_time) {
        list.push({ name: '提交业务', operator: d.submit_user || '—', time: d.submit_time, status: 'done' })
    } else {
        list.push({ name: '提交业务', operator: '—', time: '', status: 'wait' })
    }
    if (d.biz_status === 'rejected') {
        list.push({
            name: '业务审核',
            operator: d.review_user || '—',
            time: d.review_time,
            status: 'reject',
            note: d.biz_reject_reason
        })
    } else if (d.review_time) {
        list.push({ name: '业务审核', operator: d.review_user || '—', time: d.review_time, status: 'done' })
    } else {
        list.push({ name: '业务审核', operator: '—', time: '', status: 'wait' })
    }
    ;(d.nodes || []).forEach((node: any) => {
        list.push({
            name: `放款审核 · ${node.role}`,
            operator: node.user || '—',
            time: node.time,
            status: node.status == 1 ? 'done' : node.status == 2 ? 'reject' : 'wait'
        })
    })
    if (d.pay_time) {
        list.push({ name: '确认放款', operator: d.pay_user || '—', time: d.pay_time, status: 'done' })
    } else {
        list.push({ name: '确认放款', operator: '—', time: '', status: 'wait' })
    }
    return list
})

const statusText = (s: string) => ({ done: '已完成', reject: '已驳回', wait: '待处理', current: '处理中' }[s] || '')
const statusClass = (s: string) =>
    ({ done: 'text-[#67c23a]', reject: 'text-[#f56c6c]', wait: 'text-tx-secondary', current: 'text-[#e6a23c]' }[s] || '')

const activeStep = computed(() => {
    const nodes = detail.value.nodes || []
    const index = nodes.findIndex((node: any) => node.status == 0)
    return index === -1 ? nodes.length : index
})

const stepStatus = (node: any) => {
    if (node.status == 1) return 'success'
    if (node.status == 2) return 'error'
    if (node.status == 0) return 'process'
    return 'wait'
}

const open = async (row: any, approve = false) => {
    detail.value = await loanDetail({ id: row.id })
    formData.user = currentRole() + '-' + (detail.value.current_node || '')
    formData.result = 1
    formData.remark = ''
    popupRef.value?.open()
    if (approve) feedback.msg('已定位到「审批操作」区域，请核对后提交')
}

const handleSubmit = async () => {
    if (!canApprove.value) {
        feedback.msgError('当前角色与审批节点不匹配，不可跳级审批')
        return
    }
    if (formData.result == 0 && !formData.remark) {
        feedback.msgError('驳回必须填写审批意见')
        return
    }
    try {
        submitting.value = true
        await loanApprove({
            id: detail.value.id,
            role: detail.value.current_node,
            result: formData.result,
            user: formData.user,
            remark: formData.remark
        })
        feedback.msgSuccess(formData.result == 1 ? '审批通过，已流转至下一节点' : '已驳回，后续角色无需审核')
        popupRef.value?.close()
        emit('success')
    } catch (error: any) {
        feedback.msgError(error?.message || '审批失败')
    } finally {
        submitting.value = false
    }
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss" scoped>
.hx-flow {
    list-style: none;
    margin: 0;
    padding: 0;
}
.hx-flow-item {
    position: relative;
    padding-left: 22px;
    padding-bottom: 18px;
}
.hx-flow-item:last-child {
    padding-bottom: 0;
}
.hx-flow-item::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 14px;
    bottom: 0;
    width: 2px;
    background: var(--el-border-color-lighter, #ebeef5);
}
.hx-flow-item:last-child::before {
    display: none;
}
.hx-flow-dot {
    position: absolute;
    left: 0;
    top: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #c0c4cc;
}
.hx-flow-dot.is-done {
    background: #67c23a;
}
.hx-flow-dot.is-reject {
    background: #f56c6c;
}
.hx-flow-dot.is-wait {
    background: #c0c4cc;
}
.hx-flow-dot.is-current {
    background: #e6a23c;
}
</style>

