<template>
    <div class="audit-popup">
        <popup
            ref="popupRef"
            :title="title"
            :async="true"
            width="580px"
            :confirm-button-text="confirmText"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="90px" :rules="formRules">
                <!-- 驳回理由：仅驳回场景展示，必填（沿用原规则） -->
                <el-form-item v-if="requireReason" label="驳回理由" prop="reason">
                    <el-input
                        v-model="formData.reason"
                        type="textarea"
                        :rows="3"
                        maxlength="200"
                        show-word-limit
                        placeholder="驳回必须填写理由，将同步展示给提交方"
                    />
                </el-form-item>
                <el-form-item v-if="requireReason && quickList.length" label="常用理由">
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

                <!-- 文字备注：通过 / 驳回均可填写，选填 -->
                <el-form-item label="文字备注" prop="remark">
                    <el-input
                        v-model="formData.remark"
                        type="textarea"
                        :rows="3"
                        maxlength="200"
                        show-word-limit
                        placeholder="选填，通过 / 驳回均可填写备注说明"
                    />
                </el-form-item>

                <!-- 图片上传：通过 / 驳回均可上传，选填 -->
                <el-form-item label="补充图片">
                    <el-upload
                        v-model:file-list="fileList"
                        class="audit-upload"
                        list-type="picture-card"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        :auto-upload="false"
                        :limit="maxImages"
                        :on-exceed="handleExceed"
                    >
                        <span class="audit-upload__trigger">
                            <svg
                                class="audit-upload__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="2.6"
                                    y="4.6"
                                    width="13"
                                    height="13"
                                    rx="3.2"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                />
                                <circle cx="7.2" cy="9.2" r="1.4" fill="currentColor" />
                                <path
                                    d="M3.4 15.8l2.9-2.9a1.7 1.7 0 0 1 2.4 0l4.1 4.1"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                <path
                                    d="M19.2 4.8v6M16.2 7.8h6"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linecap="round"
                                />
                            </svg>
                            <span class="audit-upload__text">上传图片</span>
                        </span>
                    </el-upload>
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

/**
 * 统一「审核弹窗」：通过 / 驳回共用。
 * - 文字备注、图片上传：通过或驳回均可填写 / 上传，均为**选填**。
 * - 驳回理由：仅驳回场景（requireReason=true）展示，走原有必填规则。
 * 图片为纯前端本地预览（auto-upload=false），不依赖后端上传接口；接入后端后可改为真实上传。
 */
const props = withDefaults(
    defineProps<{
        title?: string
        confirmText?: string
        /** 是否展示「驳回理由」必填项（驳回场景置 true） */
        requireReason?: boolean
        quickList?: string[]
        /** 图片最多上传张数 */
        maxImages?: number
    }>(),
    {
        title: '审核',
        confirmText: '确定',
        requireReason: false,
        quickList: () => [],
        maxImages: 6
    }
)

export interface AuditSubmitPayload {
    reason: string
    remark: string
    images: string[]
}

const emit = defineEmits(['close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const fileList = ref<any[]>([])
const formData = reactive({ reason: '', remark: '' })
let callback: ((payload: AuditSubmitPayload) => void) | null = null

const formRules = computed(() => ({
    reason: props.requireReason
        ? [
              { required: true, message: '请填写驳回理由', trigger: ['blur'] },
              { min: 5, message: '驳回理由不少于 5 个字', trigger: ['blur'] }
          ]
        : []
}))

const handleExceed = () => feedback.msgError(`最多上传 ${props.maxImages} 张图片`)

/** 打开弹窗；cb 在确认并通过校验后回调 */
const open = (cb: (payload: AuditSubmitPayload) => void) => {
    formData.reason = ''
    formData.remark = ''
    fileList.value = []
    callback = cb
    formRef.value?.clearValidate()
    popupRef.value?.open()
}

const handleSubmit = async () => {
    try {
        await formRef.value?.validate()
    } catch {
        // 校验不通过：保持弹窗打开，等待用户修正
        return
    }
    callback?.({
        reason: formData.reason,
        remark: formData.remark,
        images: fileList.value.map((file: any) => file.name)
    })
    popupRef.value?.close()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss" scoped>
/* 「补充图片」上传区：虚线卡片 + 描边图标，悬停高亮为品牌色 */
.audit-upload {
    :deep(.el-upload--picture-card) {
        width: 100px;
        height: 100px;
        border: 1px dashed var(--el-border-color);
        border-radius: 8px;
        background-color: var(--el-fill-color-lighter);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
            border-color 0.2s,
            background-color 0.2s;

        &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
        }
    }

    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 100px;
        height: 100px;
        border-radius: 8px;
    }
}

.audit-upload__trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    line-height: 1;
    color: var(--el-text-color-secondary);
    transition: color 0.2s;

    &:hover {
        color: var(--el-color-primary);
    }
}

.audit-upload__icon {
    width: 26px;
    height: 26px;
    display: block;
}

.audit-upload__text {
    font-size: 12px;
}
</style>
