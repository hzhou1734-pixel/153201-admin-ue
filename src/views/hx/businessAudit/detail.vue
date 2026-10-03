<template>
    <div class="business-detail">
        <popup
            ref="popupRef"
            :title="isView ? '业务详情（查看）' : '业务详情'"
            :confirm-button-text="!isView && detail.status == 'auditing' ? '审核通过' : false"
            :cancel-button-text="!isView && detail.status == 'auditing' ? '驳回' : '关闭'"
            width="820px"
            @confirm="emit('pass', detail)"
            @cancel="emit('reject', detail)"
            @close="handleClose"
        >
            <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="业务编号">{{ detail.sn }}</el-descriptions-item>
                <el-descriptions-item label="客户姓名">{{ detail.customer_name }}</el-descriptions-item>
                <el-descriptions-item label="实名手机号">
                    {{ detail.customer_mobile }}
                </el-descriptions-item>
                <el-descriptions-item label="企业名称" :span="2">
                    {{ detail.company }}
                </el-descriptions-item>
                <el-descriptions-item label="业务金额">
                    ¥{{ formatterAmount(detail.amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="所属银行">{{ detail.bank_name }}</el-descriptions-item>
                <el-descriptions-item label="所属支行">{{ detail.branch_name }}</el-descriptions-item>
                <el-descriptions-item label="业务经办人">{{ detail.agent_name }}</el-descriptions-item>
                <el-descriptions-item label="提交时间">{{ detail.submit_time }}</el-descriptions-item>
                <el-descriptions-item label="签约时间">
                    {{ detail.sign_time || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="业务状态">
                    <el-tag
                        :type="
                            detail.status == 'auditing'
                                ? 'warning'
                                : detail.status == 'rejected'
                                  ? 'danger'
                                  : 'primary'
                        "
                        size="small"
                    >
                        {{ detail.status_text }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item v-if="detail.reject_reason" label="驳回理由" :span="3">
                    {{ detail.reject_reason }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="mt-4">
                <div class="mb-2 font-medium">业务材料</div>
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="客户资料" name="1" />
                    <el-tab-pane label="银行材料" name="2" />
                </el-tabs>
                <el-table :data="filteredMaterials" size="small">
                    <el-table-column label="材料名称" prop="name" min-width="300" />
                    <el-table-column label="大小" prop="size" width="110" />
                    <el-table-column label="操作" width="160">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="preview(row)">在线预览</el-button>
                            <el-button type="primary" link @click="download(row)">下载</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="mt-4">
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

        </popup>
    </div>
</template>

<script lang="ts" setup>
import { businessDetail } from '@/api/hx/audit'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

const emit = defineEmits(['pass', 'reject', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const detail = ref<any>({})
const activeTab = ref('1')

/**
 * 一个组件承载两种使用场景（props.mode 区分入口）：
 * - audit ：业务审核节点打开，支持「审核通过 / 驳回」操作
 * - view  ：客户详情等只读入口打开，仅查看业务明细，不提供审批操作
 */
const props = withDefaults(defineProps<{ mode?: 'audit' | 'view' }>(), { mode: 'audit' })
const isView = computed(() => props.mode === 'view')

const filteredMaterials = computed(() =>
    (detail.value.materials || []).filter((item: any) => String(item.type) == activeTab.value)
)

/**
 * 流程节点记录（全链路）：提交业务 → 业务审核 → 放款审核（关联放款审批单节点）→ 确认放款。
 * 每个节点记录操作人与操作时间，替代原「审批留痕」独立页面。
 */
const flow = computed(() => {
    const d = detail.value
    const list: any[] = []
    list.push({
        name: '提交业务',
        operator: d.agent_name || '—',
        time: d.submit_time,
        status: d.submit_time ? 'done' : 'wait'
    })
    if (d.status === 'rejected') {
        list.push({
            name: '业务审核',
            operator: d.review_user || '—',
            time: d.review_time,
            status: 'reject',
            note: d.reject_reason
        })
    } else if (d.review_time) {
        list.push({ name: '业务审核', operator: d.review_user || '—', time: d.review_time, status: 'done' })
    } else {
        list.push({ name: '业务审核', operator: '—', time: '', status: 'wait' })
    }
    ;(d.loan_nodes || []).forEach((node: any) => {
        list.push({
            name: `放款审核 · ${node.role}`,
            operator: node.user || '—',
            time: node.time,
            status: node.status == 1 ? 'done' : node.status == 2 ? 'reject' : 'wait'
        })
    })
    if (d.pay_time) {
        list.push({ name: '确认放款', operator: d.pay_user || '—', time: d.pay_time, status: 'done' })
    } else if ((d.loan_nodes || []).length) {
        list.push({ name: '确认放款', operator: '—', time: '', status: 'wait' })
    }
    return list
})

const statusText = (s: string) => ({ done: '已完成', reject: '已驳回', wait: '待处理', current: '处理中' }[s] || '')
const statusClass = (s: string) =>
    ({ done: 'text-[#67c23a]', reject: 'text-[#f56c6c]', wait: 'text-tx-secondary', current: 'text-[#e6a23c]' }[s] || '')

const open = async (row: any) => {
    detail.value = await businessDetail({ id: row.id })
    activeTab.value = '1'
    popupRef.value?.open()
}

const preview = () => feedback.msgWarning('演示数据未包含真实文件，接入后端后此处为在线预览')
const download = () => feedback.msgWarning('演示数据未包含真实文件，接入后端后此处为下载')
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

