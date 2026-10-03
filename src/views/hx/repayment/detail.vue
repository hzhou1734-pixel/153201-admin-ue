<template>
    <div class="repayment-detail">
        <popup
            ref="popupRef"
            title="回款凭证详情"
            custom-class="hx-repay-dialog"
            :confirm-button-text="detail.status == 1 ? false : '确认审核'"
            :cancel-button-text="detail.status == 1 ? '关闭' : '驳回'"
            width="720px"
            @confirm="emit('confirm', detail)"
            @cancel="handleCancel"
            @close="handleClose"
        >
            <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="业务编号">{{ detail.sn }}</el-descriptions-item>
                <el-descriptions-item label="客户姓名">{{ detail.customer_name }}</el-descriptions-item>
                <el-descriptions-item label="回款期数">{{ detail.period }}</el-descriptions-item>
                <el-descriptions-item label="回款金额">
                    ¥{{ formatterAmount(detail.amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="上传人">{{ detail.uploader }}</el-descriptions-item>
                <el-descriptions-item label="上传时间">{{ detail.upload_time }}</el-descriptions-item>
                <el-descriptions-item label="确认状态">
                    <el-tag
                        :type="detail.status == 1 ? 'success' : detail.status == 2 ? 'danger' : 'warning'"
                        size="small"
                    >
                        {{ detail.status_text }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="确认人 / 时间">
                    {{ detail.confirm_user ? `${detail.confirm_user} ${detail.confirm_time}` : '—' }}
                </el-descriptions-item>
                <el-descriptions-item v-if="detail.reason" label="驳回理由" :span="2">
                    {{ detail.reason }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="mt-4">
                <div class="mb-2 font-medium">
                    回款凭证图片
                    <span class="text-tx-secondary text-xs">（{{ imageVouchers.length }} 张）</span>
                </div>
                <div v-if="imageVouchers.length" class="hx-voucher-gallery">
                    <div
                        v-for="row in imageVouchers"
                        :key="row.name"
                        class="hx-voucher-thumb"
                        @click="preview(row)"
                    >
                        <el-image
                            v-if="row.url"
                            :src="row.url"
                            :preview-src-list="previewUrls"
                            :initial-index="previewUrls.indexOf(row.url)"
                            fit="cover"
                            class="hx-voucher-img"
                        >
                            <template #error>
                                <div class="hx-voucher-fallback">{{ ext(row.name) }}</div>
                            </template>
                        </el-image>
                        <div v-else class="hx-voucher-fallback">{{ ext(row.name) }}</div>
                        <div class="hx-voucher-meta">
                            <div class="hx-voucher-name" :title="row.name">{{ row.name }}</div>
                            <div class="hx-voucher-size">{{ row.size }}</div>
                        </div>
                    </div>
                </div>
                <el-empty v-else description="暂无图片类凭证" :image-size="64" />
            </div>

            <div class="mt-4">
                <div class="mb-2 font-medium">回款凭证文件（全部）</div>
                <el-table :data="detail.vouchers || []" size="small">
                    <el-table-column label="文件名称" prop="name" min-width="280" />
                    <el-table-column label="大小" prop="size" width="110" />
                    <el-table-column label="操作" width="160">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="preview(row)">在线预览</el-button>
                            <el-button type="primary" link @click="download(row)">下载</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <el-alert
                v-if="detail.status != 1"
                class="mt-4"
                type="info"
                :closable="false"
                show-icon
                title="仅财务可确认 · 此环节不影响放款"
                description="驳回后业务经办人（Y-03）可重新上传凭证。"
            />
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { repaymentDetail } from '@/api/hx/repayment'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

const emit = defineEmits(['confirm', 'reject', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const detail = ref<any>({})

/** 图片类凭证：按扩展名识别 png/jpg/gif/webp/bmp */
const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)$/i
const imageVouchers = computed(() =>
    (detail.value.vouchers || []).filter((v: any) => IMAGE_RE.test(v.name || ''))
)
/** 仅含真实 URL 的图片，供 el-image 预览大图使用 */
const previewUrls = computed(() => imageVouchers.value.filter((v: any) => v.url).map((v: any) => v.url))

const ext = (name: string) => {
    const m = /\.([a-z0-9]+)$/i.exec(name || '')
    return m ? m[1].toUpperCase() : 'FILE'
}

const open = async (row: any) => {
    detail.value = await repaymentDetail({ id: row.id })
    popupRef.value?.open()
}

const preview = () => feedback.msgWarning('演示数据未包含真实文件，接入后端后此处为在线预览')
const download = () => feedback.msgWarning('演示数据未包含真实文件，接入后端后此处为下载')

const handleCancel = () => {
    popupRef.value?.close()
    if (detail.value.status != 1) emit('reject', detail.value)
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>

<style lang="scss">
/**
 * el-dialog（append-to-body）会把弹窗内容 teleport 到 body，组件根类 .repayment-detail
 * 不再是内容的祖先，故以弹窗 custom-class="hx-repay-dialog" 作作用域（该类挂在 el-dialog 根上）。
 */
.hx-repay-dialog {
    .hx-voucher-gallery {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .hx-voucher-thumb {
        width: 120px;
        cursor: pointer;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        overflow: hidden;
        background: var(--el-fill-color-lighter);
        transition: border-color 0.2s, box-shadow 0.2s;

        &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
    }

    .hx-voucher-img {
        width: 120px;
        height: 120px;
        display: block;
    }

    .hx-voucher-fallback {
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
    }

    .hx-voucher-meta {
        padding: 6px 8px;
    }

    .hx-voucher-name {
        font-size: 12px;
        line-height: 1.4;
        color: var(--el-text-color-regular);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .hx-voucher-size {
        margin-top: 2px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}
</style>
