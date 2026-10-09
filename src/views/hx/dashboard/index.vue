<template>
    <div class="hx-dashboard">
        <!-- 顶部：工作台概览 + 时间筛选 -->
        <el-card class="!border-none mb-4" shadow="never">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center">
                    <span class="text-xl font-medium">红星钱谷业务工作台</span>
                    <span class="text-tx-secondary text-xs ml-3">
                        统计范围：{{ data.period_text || '全部（累计）' }}
                        <template v-if="periodType !== 'all'">
                            （时间筛选仅作用于下方核心指标卡片）
                        </template>
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <el-radio-group v-model="periodType" @change="onTypeChange">
                        <el-radio-button value="all">全部</el-radio-button>
                        <el-radio-button value="day">日</el-radio-button>
                        <el-radio-button value="month">月</el-radio-button>
                        <el-radio-button value="year">年</el-radio-button>
                    </el-radio-group>
                    <el-date-picker
                        v-if="periodType !== 'all'"
                        v-model="periodDate"
                        :type="pickerType"
                        :format="pickerFormat"
                        :value-format="pickerFormat"
                        :placeholder="pickerPlaceholder"
                        :clearable="false"
                        style="width: 170px"
                        @change="load"
                    />
                </div>
            </div>
        </el-card>

        <!-- 核心指标 -->
        <el-row :gutter="16">
            <el-col v-for="card in data.cards" :key="card.key" :xs="12" :sm="12" :md="8" :lg="6">
                <el-card
                    class="!border-none mb-4 cursor-pointer stat-card"
                    shadow="never"
                    @click="go(card.path)"
                >
                    <div class="flex items-center">
                        <div
                            class="stat-icon flex items-center justify-center rounded-lg"
                            :style="{ backgroundColor: calcColor(card.color, 0.12) }"
                        >
                            <icon :name="card.icon" :size="22" :color="card.color" />
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                            <div class="text-tx-secondary text-xs truncate">{{ card.title }}</div>
                            <div class="flex items-end mt-1">
                                <span class="text-2xl font-medium" :style="{ color: card.color }">
                                    {{ card.value }}
                                </span>
                                <span class="text-tx-secondary text-xs ml-1">{{ card.unit }}</span>
                            </div>
                            <div class="text-tx-secondary text-xs mt-1 truncate">
                                {{ card.hint }}
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 待办 + 业务状态 + 趋势 -->
        <el-row :gutter="16">
            <el-col :xs="24" :md="24" :lg="8">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="card-title">我的待办</span>
                            <span class="text-tx-secondary text-xs">按角色职责拆分</span>
                        </div>
                    </template>
                    <div v-if="data.todo?.length">
                        <div
                            v-for="item in data.todo"
                            :key="item.path"
                            class="flex items-center justify-between py-3 border-b border-light last:border-none"
                        >
                            <div class="min-w-0 pr-3">
                                <div class="flex items-center">
                                    <span class="font-medium">{{ item.title }}</span>
                                    <el-tag
                                        v-if="item.count > 0"
                                        class="ml-2"
                                        size="small"
                                        :type="item.type"
                                        effect="light"
                                    >
                                        {{ item.count }}
                                    </el-tag>
                                </div>
                                <div class="text-tx-secondary text-xs mt-1 truncate">
                                    {{ item.desc }}
                                </div>
                            </div>
                            <el-button link type="primary" @click="go(item.path)">去处理</el-button>
                        </div>
                    </div>
                    <el-empty v-else description="当前角色暂无待办事项" :image-size="80" />
                </el-card>
            </el-col>

            <el-col :xs="24" :md="12" :lg="8">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <span class="card-title">业务状态分布</span>
                    </template>
                    <v-charts class="chart" :option="statusOption" autoresize />
                </el-card>
            </el-col>

            <el-col :xs="24" :md="12" :lg="8">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <span class="card-title">近 6 个月业务量</span>
                    </template>
                    <v-charts class="chart" :option="trendOption" autoresize />
                </el-card>
            </el-col>
        </el-row>

        <!-- 市州分布 + 银行排行 -->
        <el-row :gutter="16">
            <el-col :xs="24" :md="24" :lg="12">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="card-title">业务地域分布（湖南省）</span>
                            <span class="text-tx-secondary text-xs">
                                覆盖 {{ coverage.covered?.length || 0 }} / {{ coverage.total }} 市州
                            </span>
                        </div>
                    </template>
                    <v-charts class="chart" :option="cityOption" autoresize />
                </el-card>
            </el-col>

            <el-col :xs="24" :md="24" :lg="12">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <span class="card-title">合作银行业务量</span>
                    </template>
                    <v-charts class="chart" :option="bankOption" autoresize />
                </el-card>
            </el-col>
        </el-row>

        <!-- 经办人业绩 -->
        <el-row :gutter="16">
            <el-col :xs="24" :md="24" :lg="24">
                <el-card class="!border-none mb-4" shadow="never">
                    <template #header>
                        <span class="card-title">业务经办人业绩 TOP5</span>
                    </template>
                    <el-table :data="data.charts?.agent || []" size="small">
                        <el-table-column type="index" label="#" width="50" />
                        <el-table-column label="经办人" prop="name" min-width="110" />
                        <el-table-column label="业务笔数" prop="count" min-width="90" />
                        <el-table-column label="业务金额" min-width="120">
                            <template #default="{ row }">
                                {{ row.amount }} 万元
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
        </el-row>

        <!-- 基础数据总览 -->
        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <span class="card-title">基础数据总览</span>
            </template>
            <el-descriptions :column="4" border>
                <el-descriptions-item label="合作银行">
                    {{ groups.org?.bank_total || 0 }} 家（启用
                    {{ groups.org?.bank_on || 0 }}）
                </el-descriptions-item>
                <el-descriptions-item label="支行">
                    {{ groups.org?.branch_total || 0 }} 个（启用
                    {{ groups.org?.branch_on || 0 }}）
                </el-descriptions-item>
                <el-descriptions-item label="业务经办人">
                    {{ groups.org?.agent_total || 0 }} 人（启用
                    {{ groups.org?.agent_on || 0 }} / 停用
                    {{ groups.org?.agent_off || 0 }}）
                </el-descriptions-item>

                <el-descriptions-item label="银行经办人">
                    {{ groups.org?.bank_agent_total || 0 }} 人（在岗
                    {{ groups.org?.bank_agent_on || 0 }}）
                </el-descriptions-item>
                <el-descriptions-item label="客户总数">
                    {{ groups.customer?.total || 0 }} 个（已绑定
                    {{ groups.customer?.bound || 0 }} / 未归属
                    {{ groups.customer?.unbound || 0 }}）
                </el-descriptions-item>
                <el-descriptions-item label="累计申请金额">
                    {{ wan(groups.business?.total_amount) }} 万元
                </el-descriptions-item>
                <el-descriptions-item label="累计放款金额">
                    {{ wan(groups.loan?.paid_amount) }} 万元
                </el-descriptions-item>
                <el-descriptions-item label="累计回款金额">
                    {{ wan(groups.repayment?.confirmed_amount) }} 万元
                </el-descriptions-item>
            </el-descriptions>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="hxDashboard">
import { useRouter } from 'vue-router'
import { ref, computed, watch, onMounted } from 'vue'
import vCharts from 'vue-echarts'

import { dashboardCityCoverage, dashboardOverview } from '@/api/hx/dashboard'
import { currentHxRole } from '@/config/hxRoles'
import { calcColor } from '@/utils/util'

const router = useRouter()
const role = currentHxRole

const data = ref<any>({})
const coverage = ref<any>({})

/** 时间筛选：all 全部 / day 日 / month 月 / year 年 */
const periodType = ref('all')
const periodDate = ref('')

/** 日期选择器的类型 / 格式 / 占位文案随筛选类型变化 */
const pickerType = computed(
    () =>
        ({ day: 'date', month: 'month', year: 'year' } as Record<string, string>)[periodType.value] ||
        'date'
)
const pickerFormat = computed(
    () =>
        ({ day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' } as Record<string, string>)[
            periodType.value
        ] || 'YYYY-MM-DD'
)
const pickerPlaceholder = computed(
    () =>
        ({ day: '选择日期', month: '选择月份', year: '选择年份' } as Record<string, string>)[
            periodType.value
        ] || '选择日期'
)

/** 按筛选类型从「数据最新日期」推导默认值，避免默认落在无数据的当天 */
const defaultPeriodDate = (type: string) => {
    const base = data.value.latest_date || new Date().toISOString().slice(0, 10)
    if (type === 'day') return base.slice(0, 10)
    if (type === 'month') return base.slice(0, 7)
    if (type === 'year') return base.slice(0, 4)
    return ''
}

/** 切换 全部/日/月/年：重置日期并按新条件重新统计 */
const onTypeChange = () => {
    periodDate.value = defaultPeriodDate(periodType.value)
    load()
}

const groups = computed(() => data.value.groups || {})
const charts = computed(() => data.value.charts || {})

/** 金额（元）→ 万元 */
const wan = (value: any) => ((Number(value) || 0) / 10000).toFixed(2)

const PALETTE = ['#4b7fff', '#6c5ce7', '#f7a325', '#1cb88a', '#e2564d', '#2bb3c0']

const statusOption = computed(() => ({
    tooltip: { trigger: 'item', formatter: '{b}：{c} 笔（{d}%）' },
    legend: { bottom: 0, textStyle: { color: '#606266' } },
    color: ['#f7a325', '#ff7d5c', '#1cb88a', '#e2564d'],
    series: [
        {
            type: 'pie',
            radius: ['45%', '68%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            label: { color: '#606266', formatter: '{b}\n{c} 笔' },
            data: charts.value.status || []
        }
    ]
}))

const trendOption = computed(() => {
    const trend = charts.value.trend || []
    return {
        tooltip: { trigger: 'axis' },
        legend: { data: ['业务金额', '业务笔数'], bottom: 0, textStyle: { color: '#606266' } },
        grid: { left: 16, right: 16, top: 24, bottom: 48, containLabel: true },
        xAxis: {
            type: 'category',
            data: trend.map((item: any) => item.month),
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisLabel: { color: '#606266' }
        },
        yAxis: [
            {
                type: 'value',
                name: '万元',
                nameTextStyle: { color: '#909399' },
                axisLabel: { color: '#606266' },
                splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
            },
            {
                type: 'value',
                name: '笔',
                nameTextStyle: { color: '#909399' },
                axisLabel: { color: '#606266' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '业务金额',
                type: 'bar',
                barWidth: 22,
                itemStyle: { color: '#4b7fff', borderRadius: [4, 4, 0, 0] },
                data: trend.map((item: any) => item.amount)
            },
            {
                name: '业务笔数',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbolSize: 6,
                itemStyle: { color: '#f7a325' },
                data: trend.map((item: any) => item.count)
            }
        ]
    }
})

const cityOption = computed(() => {
    const list = (charts.value.city || []).slice(0, 8).reverse()
    return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 16, right: 40, top: 12, bottom: 16, containLabel: true },
        xAxis: {
            type: 'value',
            name: '万元',
            nameTextStyle: { color: '#909399' },
            axisLabel: { color: '#606266' },
            splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
        },
        yAxis: {
            type: 'category',
            data: list.map((item: any) => item.name),
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisLabel: { color: '#606266' }
        },
        series: [
            {
                type: 'bar',
                barWidth: 14,
                itemStyle: { color: '#6c5ce7', borderRadius: [0, 4, 4, 0] },
                label: { show: true, position: 'right', color: '#606266', fontSize: 11 },
                data: list.map((item: any) => item.amount)
            }
        ]
    }
})

const bankOption = computed(() => {
    const list = (charts.value.bank || []).slice(0, 8).reverse()
    return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 16, right: 40, top: 12, bottom: 16, containLabel: true },
        xAxis: {
            type: 'value',
            name: '万元',
            nameTextStyle: { color: '#909399' },
            axisLabel: { color: '#606266' },
            splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
        },
        yAxis: {
            type: 'category',
            data: list.map((item: any) => item.name),
            axisLine: { lineStyle: { color: '#dcdfe6' } },
            axisLabel: { color: '#606266' }
        },
        series: [
            {
                type: 'bar',
                barWidth: 14,
                itemStyle: { color: '#1cb88a', borderRadius: [0, 4, 4, 0] },
                label: { show: true, position: 'right', color: '#606266', fontSize: 11 },
                data: list.map((item: any) => item.amount)
            }
        ]
    }
})

const go = (path: string) => {
    if (path) router.push(path)
}

const load = async () => {
    data.value = await dashboardOverview({
        role: role.value,
        period: periodType.value === 'all' ? '' : periodType.value,
        date: periodDate.value
    })
    coverage.value = await dashboardCityCoverage()
}

// 角色切换后待办按新角色重新统计
watch(role, () => load())

onMounted(() => {
    load()
})
</script>

<style lang="scss" scoped>
.hx-dashboard {
    .card-title {
        font-size: 15px;
        font-weight: 500;
    }

    .stat-card {
        transition: all 0.2s;

        &:hover {
            box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
        }
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
    }

    .chart {
        height: 260px;
        width: 100%;
    }
}
</style>
