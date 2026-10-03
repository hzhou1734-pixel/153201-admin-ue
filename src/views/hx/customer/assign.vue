<template>
    <div class="assign-popup">
        <popup
            ref="popupRef"
            title="指定业务经办人"
            :async="true"
            width="760px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-alert
                class="assign-alert mb-4"
                type="warning"
                :closable="false"
                show-icon
                title="分配权限归总经理"
                description="已归属客户可重新指定经办人；保存后客户归属业务经办人立即生效。"
            />
            <el-descriptions class="mb-4" :column="2" border size="small">
                <el-descriptions-item label="客户姓名">{{ detail.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ detail.mobile }}</el-descriptions-item>
                <el-descriptions-item label="企业名称">
                    {{ detail.company || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="绑定状态">
                    <el-tag :type="detail.bind_status == 1 ? 'success' : 'info'" size="small">
                        {{ detail.bind_status_text }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="当前归属">
                    {{ detail.agent_name || '未分配' }}
                </el-descriptions-item>
                <el-descriptions-item label="业务笔数">
                    {{ detail.business_count ?? 0 }}
                </el-descriptions-item>
            </el-descriptions>
            <el-form ref="formRef" :model="formData" label-width="104px" :rules="formRules">
                <el-form-item label="业务经办人" prop="agent_id">
                    <el-select
                        v-model="formData.agent_id"
                        class="flex-1"
                        filterable
                        clearable
                        placeholder="请选择业务经办人"
                    >
                        <el-option
                            v-for="item in agentOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import { agentAll } from '@/api/hx/agent'
import { customerAssign } from '@/api/hx/customer'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const detail = ref<any>({})
const agentOptions = ref<any[]>([])
const formData = reactive({ id: '', agent_id: '' })

const formRules = reactive({
    agent_id: [{ required: true, message: '请选择业务经办人', trigger: ['change'] }]
})

const open = async (row: any) => {
    detail.value = row
    formData.id = row.id
    formData.agent_id = row.agent_id || ''
    agentOptions.value = await agentAll()
    popupRef.value?.open()
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    await customerAssign(formData)
    feedback.msgSuccess('客户归属分配成功')
    popupRef.value?.close()
    emit('success')
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss">
/**
 * 弹窗内提示条：标题与说明文字排在同一行完整展示，不折行。
 * 弹窗内容会被 teleport 到 body，无法用 scoped 样式命中，故用唯一类名做全局声明。
 */
.assign-alert {
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
</style>
