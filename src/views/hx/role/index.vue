<template>
    <div class="hx-role">
        <el-card class="!border-none" shadow="never">
            <el-alert
                type="success"
                :closable="false"
                show-icon
                title="角色管理"
                description="按「功能板块 × 操作」的颗粒度分配每个角色的权限。点击「分配权限」可逐项勾选各板块的查看 / 新增 / 编辑 / 删除 / 审核 / 导出权限，保存后立即生效。"
            />
        </el-card>

        <el-card class="mt-4 !border-none" shadow="never">
            <el-table :data="roleRows" size="large">
                <el-table-column label="角色名称" min-width="140">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <el-tag :type="row.role === '超级管理员' ? 'danger' : 'primary'" size="small" effect="dark">
                                {{ row.role }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="角色说明" prop="desc" min-width="320" show-tooltip-when-overflow />
                <el-table-column label="权限范围（功能板块）" min-width="200">
                    <template #default="{ row }">
                        <el-popover placement="top" :width="280" trigger="hover">
                            <template #reference>
                                <el-link type="primary" :underline="false">
                                    已授权 {{ row.grantedModules.length }} / {{ moduleTotal }} 个板块
                                </el-link>
                            </template>
                            <div v-if="row.grantedModules.length" class="flex flex-wrap gap-1">
                                <el-tag
                                    v-for="m in row.grantedModules"
                                    :key="m"
                                    size="small"
                                    effect="plain"
                                >
                                    {{ m }}
                                </el-tag>
                            </div>
                            <span v-else class="text-tx-secondary">未分配任何功能板块</span>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column label="关联管理员" min-width="110">
                    <template #default="{ row }">
                        <el-tag size="small" effect="plain">{{ row.adminCount }} 人</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="140" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleAssign(row)">分配权限</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 分配权限：功能板块 × 操作 的权限颗粒度矩阵 -->
        <popup
            ref="popupRef"
            title="分配权限"
            :async="true"
            width="900px"
            custom-class="hx-role-perm-dialog"
            @confirm="handleSave"
            @close="handleClose"
        >
            <el-alert
                class="mb-4"
                type="warning"
                :closable="false"
                show-icon
                :title="`为「${currentRoleName}」分配功能权限`"
                description="勾选即授予该角色对应功能板块的某项操作权限；未勾选则不可见或不可操作。超级管理员默认拥有全部权限。"
            />
            <div class="flex items-center justify-between mb-3">
                <span class="text-tx-secondary text-sm">权限颗粒度：功能板块（行）× 操作（列）</span>
                <div class="flex gap-2">
                    <el-button size="small" @click="toggleAll(true)">全部授予</el-button>
                    <el-button size="small" @click="toggleAll(false)">全部撤销</el-button>
                </div>
            </div>
            <el-table :data="PERM_MODULES" border size="small" class="perm-matrix">
                <el-table-column label="功能板块" prop="name" min-width="140" fixed />
                <el-table-column
                    v-for="action in PERM_ACTIONS"
                    :key="action.key"
                    :label="action.name"
                    align="center"
                    width="100"
                >
                    <template #header>
                        <el-checkbox
                            :model-value="allActionOn(action.key)"
                            :indeterminate="someActionOn(action.key) && !allActionOn(action.key)"
                            @change="(val: any) => toggleAction(action.key, val)"
                        >
                            {{ action.name }}
                        </el-checkbox>
                    </template>
                    <template #default="{ row }">
                        <el-checkbox v-model="draft[row.key][action.key]" />
                    </template>
                </el-table-column>
                <el-table-column label="本板块全选" align="center" width="110">
                    <template #default="{ row }">
                        <el-checkbox
                            :model-value="allModuleOn(row.key)"
                            :indeterminate="someModuleOn(row.key) && !allModuleOn(row.key)"
                            @change="(val: any) => toggleModule(row.key, val)"
                        />
                    </template>
                </el-table-column>
            </el-table>
        </popup>
    </div>
</template>

<script lang="ts" setup name="hxRole">
import { HX_ROLES } from '@/config/hxRoles'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

import {
    PERM_ACTIONS,
    PERM_MODULES,
    ROLE_DESC,
    adminAccounts,
    rolePermissions
} from '@/api/hx/mock'
import { rolePermissionDetail, rolePermissionSave } from '@/api/hx/role'

const moduleTotal = PERM_MODULES.length
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const currentRoleName = ref('')
/** 权限草稿：功能板块 key → 操作 key → 是否授权 */
const draft = reactive<Record<string, Record<string, boolean>>>({})

const roleRows = computed(() =>
    HX_ROLES.map((role) => {
        const src = rolePermissions[role] || {}
        const grantedModules = PERM_MODULES.filter((m) =>
            PERM_ACTIONS.some((a) => src[m.key]?.[a.key])
        ).map((m) => m.name)
        return {
            role,
            desc: ROLE_DESC[role] || '',
            grantedModules,
            adminCount: adminAccounts.filter((item) => item.role === role).length
        }
    })
)

const handleAssign = async (row: any) => {
    currentRoleName.value = row.role
    const res = await rolePermissionDetail({ role: row.role })
    Object.keys(draft).forEach((k) => delete draft[k])
    PERM_MODULES.forEach((m) => {
        draft[m.key] = {}
        PERM_ACTIONS.forEach((a) => {
            draft[m.key][a.key] = !!res.perms?.[m.key]?.[a.key]
        })
    })
    popupRef.value?.open()
}

const allActionOn = (actionKey: string) =>
    PERM_MODULES.every((m) => draft[m.key]?.[actionKey])
const someActionOn = (actionKey: string) =>
    PERM_MODULES.some((m) => draft[m.key]?.[actionKey])
const toggleAction = (actionKey: string, val: boolean) => {
    PERM_MODULES.forEach((m) => (draft[m.key][actionKey] = val))
}
const allModuleOn = (moduleKey: string) => PERM_ACTIONS.every((a) => draft[moduleKey]?.[a.key])
const someModuleOn = (moduleKey: string) => PERM_ACTIONS.some((a) => draft[moduleKey]?.[a.key])
const toggleModule = (moduleKey: string, val: boolean) => {
    PERM_ACTIONS.forEach((a) => (draft[moduleKey][a.key] = val))
}
const toggleAll = (val: boolean) => {
    PERM_MODULES.forEach((m) => PERM_ACTIONS.forEach((a) => (draft[m.key][a.key] = val)))
}

const handleSave = async () => {
    const perms: Record<string, Record<string, boolean>> = {}
    PERM_MODULES.forEach((m) => {
        perms[m.key] = {}
        PERM_ACTIONS.forEach((a) => (perms[m.key][a.key] = !!draft[m.key]?.[a.key]))
    })
    await rolePermissionSave({ role: currentRoleName.value, perms })
    feedback.msgSuccess(`「${currentRoleName.value}」的权限颗粒度已保存`)
    popupRef.value?.close()
}

const handleClose = () => {}
</script>

<style lang="scss">
/* 弹窗内容 teleport 到 body，scoped 不生效，用全局唯一类名 */
.hx-role-perm-dialog {
    .perm-matrix {
        .el-table__header .cell {
            display: flex;
            justify-content: center;
        }
    }
}
</style>
