<template>
    <div class="hx-loan-pending">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[220px]" label="业务编号">
                    <el-input
                        v-model="formData.sn"
                        placeholder="请输入业务编号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="客户姓名">
                    <el-input
                        v-model="formData.customer_name"
                        placeholder="请输入客户姓名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="放款状态">
                    <el-select v-model="formData.paid_status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="待放款" :value="0" />
                        <el-option label="已放款" :value="1" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                    <el-button type="success" @click="openAdd">添加放款</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <div>
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="业务编号" prop="sn" min-width="160" />
                    <el-table-column label="客户姓名" prop="customer_name" min-width="110" />
                    <el-table-column label="放款金额" min-width="140">
                        <template #default="{ row }">
                            ¥{{ formatterAmount(row.amount) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="银行 / 支行" min-width="210" show-tooltip-when-overflow>
                        <template #default="{ row }">
                            {{ row.bank_name }} / {{ row.branch_name }}
                        </template>
                    </el-table-column>
                    <el-table-column label="业务经办人" prop="agent_name" min-width="110" />
                    <el-table-column label="审批通过时间" prop="sign_time" min-width="180" />
                    <el-table-column label="放款状态" min-width="110">
                        <template #default="{ row }">
                            <el-tag :type="row.paid_status == 1 ? 'success' : 'warning'" size="small">
                                {{ row.paid_status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="放款时间" min-width="180">
                        <template #default="{ row }">
                            {{ row.pay_time || '—' }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <el-dialog
            v-model="showAdd"
            title="添加放款 · 选择审批通过待放款业务"
            width="1000px"
            @close="addList = []"
        >
            <div class="mb-3 text-tx-secondary text-sm">
                仅列出「审批通过且待放款」的业务，点击「确认放款」即登记完成放款（系统不做线上放款，由财务线下完成）。
            </div>
            <el-table :data="addList" v-loading="addLoading" size="large" empty-text="暂无待放款业务">
                <el-table-column label="业务编号" prop="sn" min-width="150" />
                <el-table-column label="客户姓名" prop="customer_name" width="100" />
                <el-table-column label="放款金额" width="125">
                    <template #default="{ row }">
                        ¥{{ formatterAmount(row.amount) }}
                    </template>
                </el-table-column>
                <el-table-column label="银行 / 支行" min-width="160" show-tooltip-when-overflow>
                    <template #default="{ row }">
                        {{ row.bank_name }} / {{ row.branch_name }}
                    </template>
                </el-table-column>
                <el-table-column label="经办人" prop="agent_name" width="100" />
                <el-table-column label="审批通过时间" prop="sign_time" width="170" />
                <el-table-column label="操作" width="110" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="confirmPaid(row)">确认放款</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="showAdd = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="hxLoanPending">
import { loanMarkPaid, loanPendingLists } from '@/api/hx/loan'
import { ref } from 'vue'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

/**
 * 放款管理 · 放款登记（P-09）
 * 放款记录：已放款登记结果查询（只读）；
 * 添加放款：从「审批通过且待放款」记录中选择确认完成放款，替代原独立的「待放款登记」页面。
 */
const props = withDefaults(defineProps<{ mode?: 'records' }>(), { mode: 'records' })

const formData = reactive({
    sn: '',
    customer_name: '',
    // 记录节点默认只看已放款
    paid_status: 1 as any
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: loanPendingLists,
    params: formData
})

// 添加放款弹窗：列出审批通过待放款业务
const showAdd = ref(false)
const addList = ref<any[]>([])
const addLoading = ref(false)

const openAdd = async () => {
    showAdd.value = true
    addLoading.value = true
    try {
        const res = await loanPendingLists({
            sn: '',
            customer_name: '',
            paid_status: 0,
            page_no: 1,
            page_size: 100
        })
        addList.value = res?.lists || []
    } finally {
        addLoading.value = false
    }
}

const confirmPaid = async (row: any) => {
    await feedback.confirm(
        `确认「${row.sn}」已完成放款？登记后客户端业务状态即转「已完成」，并按场景推送放款通知短信（客户 + 银行经办人）。系统不做线上放款。`
    )
    await loanMarkPaid({ id: row.id })
    feedback.msgSuccess('已放款登记完成，客户端状态已转「已完成」')
    openAdd()
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
