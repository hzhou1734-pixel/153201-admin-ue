<template>
    <div class="agent-select-user">
        <popup
            ref="popupRef"
            title="选择用户开通业务经办人"
            :async="true"
            width="820px"
            confirm-button-text="确认开通"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <div class="hx-step">
                <span class="hx-step__no">1</span>
                <span class="hx-step__title">选择平台注册用户</span>
                <span class="hx-step__tip">
                    经办人账号不再需要审核：选择已注册的平台用户，直接为其开启业务经办人权限
                </span>
            </div>

            <el-input
                v-model="keyword"
                class="mb-3"
                placeholder="搜索姓名 / 手机号 / 所属市州"
                clearable
                @input="handleSearch"
            >
                <template #prefix>
                    <icon name="el-icon-Search" />
                </template>
            </el-input>

            <el-table
                v-loading="loading"
                :data="userList"
                size="large"
                max-height="260"
                :row-class-name="rowClassName"
                @row-click="handlePick"
            >
                <el-table-column width="56" align="center">
                    <template #default="{ row }">
                        <span
                            class="hx-pick"
                            :class="{
                                'is-picked': formData.user_id == row.id,
                                'is-disabled': row.is_agent
                            }"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="姓名" prop="name" min-width="100" />
                <el-table-column label="手机号" prop="mobile" min-width="130" />
                <el-table-column label="所属市州" prop="city" min-width="100" />
                <el-table-column label="注册来源" prop="source" min-width="110" />
                <el-table-column label="注册时间" prop="register_time" min-width="160" />
                <el-table-column label="经办人身份" min-width="150">
                    <template #default="{ row }">
                        <el-tag v-if="row.is_agent" type="info" size="small" effect="plain">
                            已是经办人
                        </el-tag>
                        <el-tag v-else type="success" size="small" effect="plain">可开通</el-tag>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="没有可开通的平台用户" />
                </template>
            </el-table>

            <div v-if="pickedUser" class="hx-picked">
                已选择：<b>{{ pickedUser.name }}</b> · {{ pickedUser.mobile }} ·
                {{ pickedUser.city }}
            </div>
            <div v-else class="hx-picked is-empty">尚未选择用户，请在上方列表中点击选择</div>

            <div class="hx-step mt-4">
                <span class="hx-step__no">2</span>
                <span class="hx-step__title">设置经办人归属与权限</span>
            </div>

            <el-form ref="formRef" :model="formData" label-width="90px">
                <el-form-item label="所属银行" prop="bank_id" :rules="bankRules">
                    <el-select
                        v-model="formData.bank_id"
                        class="flex-1"
                        placeholder="请选择所属银行"
                        clearable
                    >
                        <el-option
                            v-for="item in optionsData.bank"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="账号状态">
                    <el-switch
                        v-model="formData.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="停用"
                    />
                    <div class="form-tips">启用后该用户即可登录前端提交业务操作</div>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input
                        v-model="formData.remark"
                        type="textarea"
                        :rows="2"
                        maxlength="100"
                        placeholder="选填，如岗位、对接说明等"
                    />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import { agentAdd, agentUserPool } from '@/api/hx/agent'
import { bankAll } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import { useDictOptions } from '@/hooks/useDictOptions'
import feedback from '@/utils/feedback'

/**
 * 选择用户开通业务经办人
 * 业务经办人账号**不再走认证审核**：从平台注册用户池中选择用户 → 设置归属（所属银行）与账号状态
 * → 开通业务经办人权限（开通后可在列表中继续「分配权限」细化功能权限）。
 * 已是经办人的用户在选择器内置灰，不可重复开通。
 */
const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()

const loading = ref(false)
const keyword = ref('')
const userList = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const formData = reactive({
    user_id: '' as any,
    name: '',
    mobile: '',
    bank_id: '' as any,
    status: 1,
    remark: ''
})

const pickedUser = computed(() => userList.value.find((item) => item.id == formData.user_id))

const bankRules = [{ required: true, message: '请选择所属银行', trigger: ['change'] }]

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const loadUsers = async () => {
    loading.value = true
    try {
        userList.value = (await agentUserPool({ keyword: keyword.value })) || []
    } finally {
        loading.value = false
    }
}

/** 输入防抖刷新用户列表 */
const handleSearch = () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(loadUsers, 250)
}

const rowClassName = ({ row }: any) =>
    [formData.user_id == row.id ? 'is-picked-row' : '', row.is_agent ? 'is-disabled-row' : '']
        .filter(Boolean)
        .join(' ')

/** 选择用户：已是经办人的用户不可选，选中后自动带出姓名 / 手机号 */
const handlePick = (row: any) => {
    if (row.is_agent) {
        return feedback.msgWarning(
            `「${row.name}」已是${row.agent_bank_name || ''}业务经办人，无需重复开通`
        )
    }
    formData.user_id = row.id
    formData.name = row.name
    formData.mobile = row.mobile
}

const handleSubmit = async () => {
    if (!formData.user_id) {
        return feedback.msgWarning('请先选择要开通的平台用户')
    }
    try {
        await formRef.value?.validate()
    } catch {
        return
    }
    await agentAdd({ ...formData })
    feedback.msgSuccess(`已为「${formData.name}」开通业务经办人权限`)
    popupRef.value?.close()
    emit('success')
}

const open = async () => {
    keyword.value = ''
    userList.value = []
    formData.user_id = ''
    formData.name = ''
    formData.mobile = ''
    formData.bank_id = ''
    formData.status = 1
    formData.remark = ''
    formRef.value?.clearValidate()
    popupRef.value?.open()
    await loadUsers()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss" scoped>
.hx-step {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    &__no {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 12px;
        line-height: 1;
        color: #fff;
        border-radius: 50%;
        background: var(--el-color-primary);
    }

    &__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    &__tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

/* 用户选择器：自绘单选圆点（避免 radio 跨表格作用域问题） */
.hx-pick {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--el-border-color-darker);
    border-radius: 50%;
    vertical-align: middle;
    transition:
        border-color 0.2s,
        background-color 0.2s;

    &.is-picked {
        border-color: var(--el-color-primary);

        &::after {
            content: '';
            display: block;
            width: 6px;
            height: 6px;
            margin: 2.5px auto;
            border-radius: 50%;
            background: var(--el-color-primary);
        }
    }

    &.is-disabled {
        border-color: var(--el-border-color-lighter);
        background: var(--el-fill-color);
    }
}

.hx-picked {
    margin-top: 10px;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 20px;
    color: var(--el-text-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 6px;

    &.is-empty {
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-lighter);
    }
}
</style>

<style lang="scss">
/* 表格行状态（需穿透 scoped） */
.agent-select-user {
    .el-table__row {
        cursor: pointer;
    }

    .el-table__row.is-picked-row {
        background: var(--el-color-primary-light-9);
    }

    .el-table__row.is-disabled-row {
        color: var(--el-text-color-placeholder);
        cursor: not-allowed;
    }
}
</style>
