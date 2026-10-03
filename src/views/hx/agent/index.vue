<template>
    <div class="hx-agent">
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
                <el-form-item class="w-[200px]" label="状态">
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
            <el-button v-if="isAccount" type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增业务经办人
            </el-button>
            <div :class="isAccount ? 'mt-4' : ''">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="经办人姓名" prop="name" min-width="120" />
                    <el-table-column label="手机号" prop="mobile" min-width="140" />
                    <el-table-column label="所属银行" prop="bank_name" min-width="140" />
                    <el-table-column
                        label="所属支行"
                        prop="branch_name"
                        min-width="170"
                        show-tooltip-when-overflow
                    />
                    <el-table-column label="所属市州" prop="city" min-width="120" />
                    <el-table-column label="认证状态" min-width="110">
                        <template #default="{ row }">
                            <el-tag
                                :type="row.auth_status == 2 ? 'success' : row.auth_status == 0 ? 'warning' : 'info'"
                                size="small"
                            >
                                {{ row.auth_status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="已分配权限" min-width="200">
                        <template #default="{ row }">
                            <template v-if="row.perms && row.perms.length">
                                <el-tag
                                    v-for="(perm, index) in row.perms"
                                    :key="index"
                                    class="mr-1 mb-1"
                                    size="small"
                                    effect="plain"
                                >
                                    {{ perm }}
                                </el-tag>
                            </template>
                            <el-tag v-else type="danger" size="small" effect="plain">未分配</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="isAccount" label="状态" min-width="100">
                        <template #default="{ row }">
                            <el-switch
                                v-model="row.status"
                                :active-value="1"
                                :inactive-value="0"
                                @change="changeStatus(row)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="最近登录时间" prop="last_login_time" min-width="180">
                        <template #default="{ row }">
                            {{ row.last_login_time || '—' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="isAccount" type="primary" link @click="handleEdit(row)">
                                编辑
                            </el-button>
                            <el-button type="primary" link @click="handleAuth(row)">分配权限</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
        <auth-popup v-if="showAuth" ref="authRef" @success="getLists" @close="showAuth = false" />
    </div>
</template>

<script lang="ts" setup name="hxAgent">
import { bankAll } from '@/api/hx/bank'
import { agentLists, agentStatus } from '@/api/hx/agent'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import AuthPopup from './auth.vue'
import EditPopup from './edit.vue'

/**
 * 账号与权限 · 业务经办人账号按职责拆为两个路由（P-02）：
 * - mode = account ：账号管理 —— 新增经办人账号、账号停用 / 启用
 * - mode = perm    ：权限分配 —— 分配业务操作权限（权限归总经理）；分配后经办人凭手机号验证码经客户端个人中心登录
 */
const props = withDefaults(defineProps<{ mode?: 'account' | 'perm' }>(), { mode: 'account' })

const isAccount = computed(() => props.mode === 'account')

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const authRef = shallowRef<InstanceType<typeof AuthPopup>>()
const showEdit = ref(false)
const showAuth = ref(false)
const formData = reactive({
    name: '',
    mobile: '',
    bank_id: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: agentLists,
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const changeStatus = async (row: any) => {
    await agentStatus({ id: row.id, status: row.status })
    feedback.msgSuccess(row.status == 1 ? '账号已启用' : '账号已停用，该经办人将无法登录客户端')
    getLists()
}

const handleAdd = async () => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('add')
}

const handleEdit = async (row: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('edit')
    editRef.value?.setFormData(row)
}

const handleAuth = async (row: any) => {
    showAuth.value = true
    await nextTick()
    authRef.value?.open(row)
}

onMounted(() => {
    getLists()
})
</script>
