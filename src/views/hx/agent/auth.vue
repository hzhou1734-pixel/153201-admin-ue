<template>
    <div class="auth-popup">
        <popup
            ref="popupRef"
            title="分配权限"
            :async="true"
            width="560px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-alert
                class="mb-4"
                type="warning"
                :closable="false"
                show-icon
                title="分配权限归总经理"
                description="权限分配完成后，经办人凭手机号验证码经客户端个人中心登录（Y-01），仅可操作已授权的功能。"
            />
            <div class="mb-3 text-tx-secondary">
                经办人：<span class="text-tx-primary">{{ detail.name || '—' }}</span>
                <span class="ml-4">{{ detail.mobile }}</span>
                <span class="ml-4">{{ detail.bank_name }}</span>
            </div>
            <el-tree
                ref="treeRef"
                :data="permTree"
                show-checkbox
                node-key="id"
                check-strictly
                default-expand-all
                :props="{ label: 'label', children: 'children' }"
            />
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { ElTree } from 'element-plus'

import { agentAuthSave, agentDetail, agentPermTree } from '@/api/hx/agent'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

const emit = defineEmits(['success', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const treeRef = shallowRef<InstanceType<typeof ElTree>>()
const permTree = ref<any[]>([])
const detail = ref<any>({})

const open = async (row: any) => {
    detail.value = await agentDetail({ id: row.id })
    permTree.value = await agentPermTree()
    popupRef.value?.open()
    await nextTick()
    treeRef.value?.setCheckedKeys(detail.value.perms || [], false)
}

const handleSubmit = async () => {
    const checked = treeRef.value?.getCheckedKeys() || []
    await agentAuthSave({ id: detail.value.id, perms: checked })
    feedback.msgSuccess('权限分配成功，经办人可凭手机号验证码登录客户端')
    popupRef.value?.close()
    emit('success')
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>
