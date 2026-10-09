<template>
    <div class="hx-bank-agent">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[200px]" label="经办人姓名">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入姓名"
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
                <el-form-item class="w-[220px]" label="所属银行">
                    <el-select v-model="formData.bank_id" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option
                            v-for="item in optionsData.bank"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item class="w-[200px]" label="账号状态">
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="启用" :value="1" />
                        <el-option label="停用" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <div class="mb-3 text-xs text-tx-secondary">
                登录规则：仅账号为「启用」状态的银行经办人可登录前端提交业务操作；已停用账号无法登录。
                经办人账号由后台选择平台注册用户开通，本页用于查看与日常维护。
            </div>

            <el-table :data="pager.lists" size="large">
                <el-table-column label="经办人姓名" prop="name" min-width="120" />
                <el-table-column label="手机号" prop="mobile" min-width="140" />
                <el-table-column
                    label="所属银行"
                    prop="bank_name"
                    min-width="140"
                    show-tooltip-when-overflow
                />
                <el-table-column
                    label="所属支行"
                    prop="branch_name"
                    min-width="170"
                    show-tooltip-when-overflow
                />
                <el-table-column label="岗位" min-width="120">
                    <template #default="{ row }">
                        {{ row.position || '—' }}
                    </template>
                </el-table-column>
                <el-table-column label="账号状态" min-width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.status == 1 ? 'success' : 'info'" size="small">
                            {{ row.status == 1 ? '启用' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="前端登录" min-width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.can_login ? 'success' : 'info'" size="small" effect="light">
                            {{ row.can_login ? '可登录' : '不可登录' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="关联业务数" prop="business_count" min-width="110" />
                <el-table-column label="最近登录" min-width="170">
                    <template #default="{ row }">
                        {{ row.last_login_time || '—' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="190" fixed="right">
                    <template #default="{ row }">
                        <span
                            class="hx-op-cell inline-flex"
                            @click="withPerm(() => handleEdit(row))"
                        >
                            <el-button type="primary" link :disabled="!canManage">编辑</el-button>
                        </span>
                        <span
                            class="hx-op-cell inline-flex"
                            @click="withPerm(() => changeStatus(row))"
                        >
                            <el-button type="primary" link :disabled="!canManage">
                                {{ row.status == 1 ? '停用' : '启用' }}
                            </el-button>
                        </span>
                        <span
                            class="hx-op-cell inline-flex"
                            @click="withPerm(() => handleRemove(row))"
                        >
                            <el-button type="danger" link :disabled="!canManage">移除</el-button>
                        </span>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="暂无银行经办人，可在业务经办人账号页选择平台注册用户开通经办人权限" />
                </template>
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
    </div>
</template>

<script lang="ts" setup name="hxBankAgent">
import { bankAgentLists, bankAgentRemove, bankAgentStatus } from '@/api/hx/bankAgent'
import { bankAll } from '@/api/hx/bank'
import { HX_ROLE_GM, HX_ROLE_SUPER, currentHxRole } from '@/config/hxRoles'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import EditPopup from './edit.vue'

/**
 * 用户管理 · 银行经办人（在册经办人列表）
 * 经办人账号不再走「认证申请 → 后台审核」：账号由后台选择平台注册用户开通经办人权限，
 * 因此本页不再提供审核入口，仅保留在册经办人的查看与日常维护（编辑资料、停用 / 启用、移除）。
 *
 * 登录规则：仅账号为「启用」状态的经办人可登录前端提交业务操作。
 * 管理权限归总经理与超级管理员；其余角色只读查看。
 */
const canManage = computed(() => [HX_ROLE_SUPER, HX_ROLE_GM].includes(currentHxRole.value))

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)

const formData = reactive({
    name: '',
    mobile: '',
    bank_id: '',
    status: ''
})

const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: bankAgentLists,
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

/** 权限拦截：无管理权限时给出提示（禁用按钮不派发事件，由外层 .hx-op-cell 承接） */
const withPerm = (fn: () => any) => {
    if (!canManage.value) {
        return feedback.msgWarning('银行经办人管理权限归总经理与超级管理员')
    }
    return fn()
}

const changeStatus = async (row: any) => {
    const status = row.status == 1 ? 0 : 1
    await bankAgentStatus({ id: row.id, status })
    feedback.msgSuccess(status == 1 ? '银行经办人已启用' : '银行经办人已停用')
    getLists()
}

const handleEdit = async (row: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open()
    editRef.value?.setFormData(row)
}

const handleRemove = async (row: any) => {
    await feedback.confirm(
        `确认移除银行经办人「${row.name}」？移除后该用户不再具备 ${row.bank_name} 经办人身份，也无法登录前端提交业务操作（平台用户本身不受影响）。`
    )
    await bankAgentRemove({ id: row.id })
    feedback.msgSuccess('银行经办人已移除')
    getLists()
}

onMounted(() => {
    getLists()
})
</script>

<style lang="scss">
/**
 * 操作栏：Chrome 下禁用态按钮不派发（也不冒泡）鼠标事件，
 * 让禁用按钮 pointer-events: none，点击由外层 .hx-op-cell 接管并给出权限提示。
 */
.hx-op-cell {
    cursor: pointer;

    .el-button.is-disabled {
        pointer-events: none;
    }
}
</style>
