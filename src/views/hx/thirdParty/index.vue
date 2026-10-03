<template>
    <div class="hx-third-party">
        <el-card class="!border-none" shadow="never">
            <el-tabs v-model="activeTab" :class="{ 'hx-hide-tab-nav': !showTabNav }">
                <!-- 云存储 -->
                <el-tab-pane label="云存储对接" name="storage">
                    <el-form
                        :model="formData.storage"
                        label-width="130px"
                        class="max-w-[720px] mt-2"
                    >
                        <el-form-item label="启用状态">
                            <el-switch
                                v-model="formData.storage.status"
                                :active-value="1"
                                :inactive-value="0"
                            />
                        </el-form-item>
                        <el-form-item label="存储服务商">
                            <el-select v-model="formData.storage.driver" class="w-[260px]">
                                <el-option label="阿里云 OSS" value="aliyun" />
                                <el-option label="腾讯云 COS" value="qcloud" />
                                <el-option label="七牛云" value="qiniu" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="AccessKey">
                            <el-input v-model="formData.storage.access_key" placeholder="请输入 AccessKey" />
                        </el-form-item>
                        <el-form-item label="SecretKey">
                            <el-input
                                v-model="formData.storage.secret_key"
                                show-password
                                placeholder="请输入 SecretKey"
                            />
                        </el-form-item>
                        <el-form-item label="Bucket">
                            <el-input v-model="formData.storage.bucket" placeholder="请输入 Bucket" />
                        </el-form-item>
                        <el-form-item label="访问域名">
                            <el-input v-model="formData.storage.domain" placeholder="请输入访问域名" />
                        </el-form-item>
                        <el-form-item label="Region">
                            <el-input v-model="formData.storage.region" placeholder="请输入 Region" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('storage')">
                                保存
                            </el-button>
                            <el-button @click="handleTest('storage')">连通性测试</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 短信 -->
                <el-tab-pane label="短信对接" name="sms">
                    <el-form :model="formData.sms" label-width="130px" class="max-w-[720px] mt-2">
                        <el-form-item label="启用状态">
                            <el-switch
                                v-model="formData.sms.status"
                                :active-value="1"
                                :inactive-value="0"
                            />
                        </el-form-item>
                        <el-form-item label="短信服务商">
                            <el-select v-model="formData.sms.driver" class="w-[260px]">
                                <el-option label="阿里云短信" value="aliyun" />
                                <el-option label="腾讯云短信" value="qcloud" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="AccessKey">
                            <el-input v-model="formData.sms.access_key" placeholder="请输入 AccessKey" />
                        </el-form-item>
                        <el-form-item label="SecretKey">
                            <el-input
                                v-model="formData.sms.secret_key"
                                show-password
                                placeholder="请输入 SecretKey"
                            />
                        </el-form-item>
                        <el-form-item label="短信签名">
                            <el-input v-model="formData.sms.sign" placeholder="请输入短信签名" />
                        </el-form-item>
                        <el-form-item label="场景模板">
                            <el-table :data="smsTemplateList" size="small" class="w-full">
                                <el-table-column label="短信场景" prop="scene" min-width="220" />
                                <el-table-column label="接收对象" prop="target" min-width="160" />
                                <el-table-column label="模板 ID" min-width="150">
                                    <template #default="{ row }">
                                        <el-input
                                            v-model="formData.sms.templates[row.key]"
                                            size="small"
                                        />
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('sms')">
                                保存
                            </el-button>
                            <el-button @click="handleTest('sms')">发送测试短信</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- e签宝 -->
                <el-tab-pane label="E签宝对接" name="esign">
                    <el-form :model="formData.esign" label-width="130px" class="max-w-[720px] mt-2">
                        <el-form-item label="启用状态">
                            <el-switch
                                v-model="formData.esign.status"
                                :active-value="1"
                                :inactive-value="0"
                            />
                        </el-form-item>
                        <el-form-item label="AppId">
                            <el-input v-model="formData.esign.app_id" placeholder="请输入 AppId" />
                        </el-form-item>
                        <el-form-item label="AppSecret">
                            <el-input
                                v-model="formData.esign.app_secret"
                                show-password
                                placeholder="请输入 AppSecret"
                            />
                        </el-form-item>
                        <el-form-item label="人脸认证">
                            <el-switch
                                v-model="formData.esign.face_auth"
                                :active-value="1"
                                :inactive-value="0"
                            />
                            <span class="form-tips ml-2">签约前需完成人脸认证</span>
                        </el-form-item>
                        <el-form-item label="结果回传地址">
                            <el-input
                                v-model="formData.esign.notify_url"
                                placeholder="请输入签署结果回调地址"
                            />
                        </el-form-item>
                        <el-form-item label="签约流程">
                            <el-input v-model="formData.esign.sign_flow" readonly />
                            <div class="form-tips">
                                人脸认证 → 意愿确认 → 签署 → 签署结果回传（P-07 签约短信由本通道下发链接）
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('esign')">
                                保存
                            </el-button>
                            <el-button @click="handleTest('esign')">连通性测试</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 小程序 -->
                <el-tab-pane label="小程序对接" name="weapp">
                    <el-form :model="formData.weapp" label-width="130px" class="max-w-[720px] mt-2">
                        <el-form-item label="启用状态">
                            <el-switch
                                v-model="formData.weapp.status"
                                :active-value="1"
                                :inactive-value="0"
                            />
                        </el-form-item>
                        <el-form-item label="小程序名称">
                            <el-input v-model="formData.weapp.name" placeholder="请输入小程序名称" />
                        </el-form-item>
                        <el-form-item label="AppId">
                            <el-input v-model="formData.weapp.app_id" placeholder="请输入小程序 AppId" />
                        </el-form-item>
                        <el-form-item label="AppSecret">
                            <el-input
                                v-model="formData.weapp.app_secret"
                                show-password
                                placeholder="请输入小程序 AppSecret"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('weapp')">
                                保存
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="hxThirdParty">
import { smsTemplates, thirdPartyGet, thirdPartySave, thirdPartyTest } from '@/api/hx/thirdParty'
import feedback from '@/utils/feedback'

/**
 * 系统对接 · 按对接方拆为四个独立路由（P-11）：
 * 每个路由通过 props.tab 指定自身承载的对接配置，页面只呈现该对接方的参数，
 * 不再把四类配置堆在同一个路由里。
 */
const props = defineProps<{ tab?: 'storage' | 'sms' | 'esign' | 'weapp' }>()

const TAB_META: Record<string, { title: string; desc: string }> = {
    storage: {
        title: '系统对接 · 云存储对接',
        desc: '配置业务材料（客户资料、银行材料、回款凭证）的云存储服务，材料上传与在线预览下载均依赖本通道。'
    },
    sms: {
        title: '系统对接 · 短信对接',
        desc: '配置短信通道与四类短信场景模板：客户签约通知、放款通知（客户）、放款通知（银行经办人）、审核结果通知。'
    },
    esign: {
        title: '系统对接 · E签宝对接',
        desc: '配置电子签约通道：人脸认证 + 意愿确认 + 签署 + 签署结果回传；P-07 审核通过后向客户推送的签约链接由本通道生成。'
    },
    weapp: {
        title: '系统对接 · 小程序对接',
        desc: '配置客户端小程序对接参数，客户扫码注册、业务进度查询与状态回写均通过该通道。'
    }
}

const showTabNav = computed(() => !props.tab)

const activeTab = ref(props.tab || 'storage')
const saving = ref(false)
const smsTemplateList = ref<any[]>([])
const formData = reactive<Record<string, any>>({
    storage: {},
    sms: { templates: {} },
    esign: {},
    weapp: {}
})

const load = async () => {
    const keys = ['storage', 'sms', 'esign', 'weapp']
    for (const key of keys) {
        formData[key] = await thirdPartyGet({ key: key as any })
    }
    if (!formData.sms.templates) formData.sms.templates = {}
}

const handleSave = async (key: string) => {
    saving.value = true
    try {
        await thirdPartySave({ key: key as any, data: formData[key] })
        feedback.msgSuccess('配置保存成功')
    } finally {
        saving.value = false
    }
}

const handleTest = async (key: string) => {
    const res: any = await thirdPartyTest({ key: key as any })
    feedback.msgSuccess(res?.message || '测试通过')
}

onMounted(async () => {
    await load()
    smsTemplateList.value = await smsTemplates()
})
</script>

<style lang="scss" scoped>
/* 独立路由承载单一对接配置时隐藏 Tab 导航，避免与侧边栏菜单重复表达层级 */
.hx-hide-tab-nav {
    :deep(.el-tabs__header) {
        display: none;
    }
}
</style>
