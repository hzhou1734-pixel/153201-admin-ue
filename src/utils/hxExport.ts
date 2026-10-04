import * as XLSX from 'xlsx'

/**
 * 红星钱谷业务系统 —— 列表页 Excel 导出工具
 *
 * 适用场景：客户列表 / 待审核业务 / 放款审批 / 放款记录 / 回款记录等「报表型」列表页，
 * 需要在保留当前筛选条件的前提下，把数据导出为 Excel 表格留档或二次核算。
 *
 * 设计约定：
 * 1）导出的是「当前筛选条件下的全部数据」，不是屏幕上的当前页 —— 先按分页协议逐页取全量再落表；
 * 2）金额列导出为**数值**（不是带 ¥ 的字符串），列头标注单位「(元)」，便于 Excel 内直接求和统计；
 * 3）状态类列取列表接口已有的 *_text 文案，与页面展示保持一致；
 * 4）落表时给表头加自动筛选、列宽按内容预设，打开即用，不需要再手工调整。
 */

export interface HxExportColumn {
    /** 表头文案 */
    label: string
    /** 取值：字符串为字段名，函数为按行计算（如拼接「银行 / 支行」） */
    value: string | ((row: HxExportRow) => any)
    /** 列宽（字符数），默认 16 */
    width?: number
}

export type HxExportRow = Record<string, any>

/** 两位补零 */
function pad(value: number) {
    return String(value).padStart(2, '0')
}

/** 文件名时间戳：20261005_0014 */
export function exportStamp(date = new Date()) {
    return (
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `_${pad(date.getHours())}${pad(date.getMinutes())}`
    )
}

/**
 * 全量分页拉取。
 *
 * 列表页统一走 likeadmin 分页协议（返回 { count, lists }）；直接把 page_size 设成很大在部分真实
 * 后端会被上限截断，因此这里按固定页大小逐页取，兼容 mock 与真实接口。
 */
export async function fetchHxAllPages(
    fetchFun: (_arg: any) => Promise<any>,
    params: Record<string, any> = {},
    pageSize = 500
) {
    const first = await fetchFun({ ...params, page_no: 1, page_size: pageSize })
    const count = Number(first?.count || 0)
    const lists: HxExportRow[] = [...(first?.lists || [])]
    const totalPage = Math.max(1, Math.ceil(count / pageSize))
    for (let page = 2; page <= totalPage; page++) {
        const res = await fetchFun({ ...params, page_no: page, page_size: pageSize })
        lists.push(...(res?.lists || []))
    }
    return lists
}

/**
 * 导出 .xlsx 并触发浏览器下载。
 *
 * @param fileName 文件名（不含扩展名，自动拼接时间戳）
 * @param columns  列定义（表头 + 取值方式）
 * @param rows     数据行（建议用 fetchHxAllPages 取全量）
 * @param sheetName 工作表名，默认「数据」
 */
export function exportHxExcel(
    fileName: string,
    columns: HxExportColumn[],
    rows: HxExportRow[],
    sheetName = '数据'
) {
    const header = columns.map((column) => column.label)
    const body = rows.map((row) =>
        columns.map((column) => {
            const value =
                typeof column.value === 'function' ? column.value(row) : row[column.value]
            return value === null || value === undefined ? '' : value
        })
    )

    const sheet = XLSX.utils.aoa_to_sheet([header, ...body])
    sheet['!cols'] = columns.map((column) => ({ wch: column.width || 16 }))
    // 表头挂自动筛选：导出后可直接按列筛选 / 排序
    if (columns.length) {
        sheet['!autofilter'] = {
            ref: XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: { r: rows.length, c: columns.length - 1 }
            })
        }
    }

    const book = XLSX.utils.book_new()
    // Excel 工作表名上限 31 字符且不允许 : \ / ? * [ ]
    XLSX.utils.book_append_sheet(book, sheet, sheetName.replace(/[:\\/?*[\]]/g, '').slice(0, 31))

    const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}_${exportStamp()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
