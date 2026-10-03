<template>
    <div class="bank-agent-auth-detail">
        <popup
            ref="popupRef"
            :title="canAudit ? '银行经办人认证审核' : '认证申请详情'"
            :confirm-button-text="canAudit ? '审核通过' : false"
            :cancel-button-text="canAudit ? '驳回' : '关闭'"
            width="780px"
            @confirm="emit('pass', detail)"
            @cancel="emit('reject', detail)"
            @close="handleClose"
        >
            <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="申请编号">{{ detail.sn }}</el-descriptions-item>
                <el-descriptions-item label="申请人">{{ detail.name }}</el-descriptions-item>
                <el-descriptions-item label="实名手机号">{{ detail.mobile }}</el-descriptions-item>
                <el-descriptions-item label="证件号码">{{ detail.id_card || '—' }}</el-descriptions-item>
                <el-descriptions-item label="所在城市">{{ detail.city || '—' }}</el-descriptions-item>
                <el-descriptions-item label="申请来源">{{ detail.source || '—' }}</el-descriptions-item>
                <el-descriptions-item label="申请银行">{{ detail.bank_name }}</el-descriptions-item>
                <el-descriptions-item label="申请支行">{{ detail.branch_name }}</el-descriptions-item>
                <el-descriptions-item label="申请岗位">
                    {{ detail.position || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="所属机构" :span="2">
                    {{ detail.company || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="提交时间">{{ detail.apply_time }}</el-descriptions-item>
                <el-descriptions-item label="认证状态">
                    <el-tag :type="statusTag(detail.status)" size="small">
                        {{ detail.status_text }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="审核人">
                    {{ detail.audit_user || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="审核时间">
                    {{ detail.audit_time || '—' }}
                </el-descriptions-item>
                <el-descriptions-item v-if="detail.reject_reason" label="驳回理由" :span="3">
                    <span class="text-[#f56c6c]">{{ detail.reject_reason }}</span>
                </el-descriptions-item>
                <el-descriptions-item v-if="detail.remark" label="申请备注" :span="3">
                    {{ detail.remark }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="mt-4">
                <div class="mb-2 font-medium">认证材料</div>
                <el-table :data="detail.materials || []" size="small">
                    <el-table-column label="材料名称" prop="name" min-width="300" />
                    <el-table-column label="大小" prop="size" width="110" />
                    <el-table-column label="类型" width="120">
                        <template #default="{ row }">
                            {{ row.type == 1 ? '身份材料' : '在职证明' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="preview(row)">在线预览</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="mt-4">
                <div class="mb-3 font-medium">认证流程节点记录</div>
                <ul class="hx-flow">
                    <li v-for="(n, i) in flow" :key="i" class="hx-flow-item">
                        <span class="hx-flow-dot" :class="`is-${n.status}`"></span>
                        <div class="hx-flow-body">
                            <div class="flex items-center justify-between">
                                <span class="font-medium">{{ n.name }}</span>
                                <span class="text-xs" :class="statusClass(n.status)">
                                    {{ statusText(n.status) }}
                                </span>
                            </div>
                            <div v-if="n.operator || n.time" class="mt-1 text-sm text-tx-secondary">
                                <template v-if="n.operator">操作人：{{ n.operator }}</template>
                                <template v-if="n.time"
                                    ><span class="ml-3">时间：{{ n.time }}</span></template
                                >
                            </div>
                            <div v-if="n.note" class="mt-1 text-xs text-[#f56c6c]">{{ n.note }}</div>
                        </div>
                    </li>
                </ul>
            </div>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { bankAgentApplyDetail } from '@/api/hx/bankAgent'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

const emit = defineEmits(['pass', 'reject', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const detail = ref<any>({})

/**
 * 一个组件承载两种使用场景：
 * - audit：待审核申请打开，支持「审核通过 / 驳回」
 * - view ：已审核申请打开，仅查看申请资料与审核结果
 */
const props = withDefaults(defineProps<{ mode?: 'audit' | 'view' }>(), { mode: 'audit' })
const isView = computed(() => props.mode === 'view')
const canAudit = computed(() => !isView.value && detail.value.status == 'pending')

const statusTag = (s: string): 'warning' | 'success' | 'danger' =>
    s == 'pending' ? 'warning' : s == 'approved' ? 'success' : 'danger'

/**
 * 认证流程节点记录：提交认证申请 → 后台审核 → 生成经办人账号（审核通过后）
 */
const flow = computed(() => {
    const d = detail.value
    const list: any[] = [
        {
            name: '提交认证申请',
            operator: d.name || '—',
            time: d.apply_time,
            status: d.apply_time ? 'done' : 'wait'
        }
    ]
    if (d.status === 'rejected') {
        list.push({
            name: '后台审核',
            operator: d.audit_user || '—',
            time: d.audit_time,
            status: 'reject',
            note: d.reject_reason
        })
        list.push({ name: '生成经办人账号', operator: '—', time: '', status: 'wait' })
    } else if (d.status === 'approved') {
        list.push({
            name: '后台审核',
            operator: d.audit_user || '—',
            time: d.audit_time,
            status: 'done'
        })
        list.push({
            name: '生成经办人账号',
            operator: d.audit_user || '—',
            time: d.audit_time,
            status: 'done'
        })
    } else {
        list.push({ name: '后台审核', operator: '—', time: '', status: 'wait' })
        list.push({ name: '生成经办人账号', operator: '—', time: '', status: 'wait' })
    }
    return list
})

const statusText = (s: string) =>
    ({ done: '已完成', reject: '已驳回', wait: '待处理', current: '处理中' })[s] || ''
const statusClass = (s: string) =>
    ({ done: 'text-[#67c23a]', reject: 'text-[#f56c6c]', wait: 'text-tx-secondary', current: 'text-[#e6a23c]' })[
        s
    ] || ''

const open = async (row: any) => {
    detail.value = await bankAgentApplyDetail({ id: row.id })
    popupRef.value?.open()
}

const preview = () => feedback.msgWarning('演示数据未包含真实文件，接入后端后此处为在线预览')
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
