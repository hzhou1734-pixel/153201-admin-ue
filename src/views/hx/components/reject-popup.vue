<template>
    <div class="reject-popup">
        <popup
            ref="popupRef"
            :title="title"
            :async="true"
            width="540px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-alert
                v-if="tips"
                class="mb-4"
                type="warning"
                :closable="false"
                show-icon
                :title="tips"
            />
            <el-form ref="formRef" :model="formData" label-width="90px" :rules="formRules">
                <el-form-item label="驳回理由" prop="reason">
                    <el-input
                        v-model="formData.reason"
                        type="textarea"
                        :rows="4"
                        maxlength="200"
                        show-word-limit
                        placeholder="驳回必须填写理由，将同步展示给提交方"
                    />
                </el-form-item>
                <el-form-item v-if="quickList.length" label="常用理由">
                    <el-space wrap>
                        <el-tag
                            v-for="(item, index) in quickList"
                            :key="index"
                            class="cursor-pointer"
                            type="info"
                            effect="plain"
                            @click="formData.reason = item"
                        >
                            {{ item }}
                        </el-tag>
                    </el-space>
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import Popup from '@/components/popup/index.vue'

withDefaults(
    defineProps<{
        title?: string
        tips?: string
        quickList?: string[]
    }>(),
    {
        title: '驳回',
        tips: '',
        quickList: () => []
    }
)

const emit = defineEmits(['close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const formData = reactive({ reason: '' })
const currentRow = ref<any>({})
let callback: ((reason: string) => void) | null = null

const formRules = reactive({
    reason: [
        { required: true, message: '请填写驳回理由', trigger: ['blur'] },
        { min: 5, message: '驳回理由不少于 5 个字', trigger: ['blur'] }
    ]
})

const open = (row: any, cb: (reason: string) => void) => {
    currentRow.value = row
    formData.reason = ''
    callback = cb
    popupRef.value?.open()
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    callback?.(formData.reason)
    popupRef.value?.close()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>
