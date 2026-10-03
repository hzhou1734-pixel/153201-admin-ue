/**
 * 菜单融合：把本项目业务节点并入后台原有菜单，形成「一个整体」的后台导航。
 *
 * 规则（由 hxMenus 中节点的 meta 描述）：
 * - meta.hostTitle：命中的节点不单独渲染，而是注入到后台同名菜单的 children 中
 *   （客户列表 / 客户归属分配 → 用户管理；系统对接 → 系统设置）
 * - meta.hostInsert：注入位置，'append' 追加到末尾，数字为下标（系统设置取 1，即第二个路由）
 * - meta.hostMoveTo：宿主菜单在一级菜单中的目标位置（用户管理取 1，即排到第二位）
 * - 后台暂无该菜单时（例如未登录的本地预览），保留本地包装组作为独立一级菜单兜底
 *
 * 说明：并入后台菜单的子节点使用绝对路径，因此注入后点击仍命中项目自身的常量路由，
 *      不会因为与宿主菜单 path 拼接而产生 /user/hx/customer/list 这类不存在的地址。
 */

/** 深拷贝菜单树，避免污染 userStore 中的原始数据 */
export function cloneMenus(list: any[]): any[] {
    return (list || []).map((item) => ({
        ...item,
        meta: item.meta ? { ...item.meta } : item.meta,
        children: item.children ? cloneMenus(item.children) : item.children
    }))
}

/**
 * 菜单图标规则（按标题关键词匹配，自上而下取首个命中项）。
 *
 * 背景：侧边栏「一级目录 + 二级菜单」左侧都要有图标。业务节点已在 hxMenus 中逐个声明 meta.icon，
 * 但上线后菜单由后端下发，后台原有菜单（用户列表 / 角色管理 / 网站信息 等）不带 icon，
 * 会出现「有的有图标、有的没有」的参差感。此处统一兜底，保证任何来源的菜单都有图标。
 *
 * 例外：**三级及更深菜单不显示图标**（见 normalizeMenuIcons），仅用于二级及以上。
 */
const MENU_ICON_RULES: Array<[RegExp, string]> = [
    [/客户|用户|会员|人员|账号|经办人|实名|会员卡/, 'el-icon-User'],
    [/银行|机构|支行|部门|组织|门店|网点/, 'el-icon-OfficeBuilding'],
    [/角色|权限|授权|菜单|岗位/, 'el-icon-Key'],
    [/留痕|记录|日志|历史|明细|档案/, 'el-icon-Tickets'],
    [/审核|审批|认证|复核|风控/, 'el-icon-DocumentChecked'],
    [/放款|回款|资金|金额|财务|结算|对账|支付/, 'el-icon-Money'],
    [/统计|报表|数据|分析|趋势|看板/, 'el-icon-DataLine'],
    [/消息|短信|通知|模板|公告/, 'el-icon-ChatDotSquare'],
    [/对接|接口|三方|链接|集成|回调|开放平台/, 'el-icon-Link'],
    [/文件|素材|附件|存储|云|上传|下载/, 'el-icon-FolderOpened'],
    [/订单|申请|业务|单据|合同|项目|产品|商品/, 'el-icon-Document'],
    [/设置|配置|参数|信息|编辑/, 'el-icon-Setting']
]

/** 全部规则未命中时的默认图标 */
const DEFAULT_MENU_ICON = 'el-icon-More'

/** 按标题挑选一个语义相近的图标 */
function pickMenuIcon(title: string): string {
    const hit = MENU_ICON_RULES.find(([rule]) => rule.test(title))
    return hit ? hit[1] : DEFAULT_MENU_ICON
}

/**
 * 图标补全：为「一级目录 / 二级菜单」中缺少 meta.icon 的节点补一个语义图标；
 * 一级目录本身已有图标，仅当它是叶子节点（如工作台）时才补。
 * 已声明图标的节点一律保持原样，不做覆盖。
 *
 * 三级及更深菜单**不配图标**（按需求统一去掉左侧 logo）：命中该层级时强制清空 icon，
 * 无论本地 hxMenus 是否声明、还是后端下发的菜单自带图标，最终渲染都不会出现图标。
 */
export function normalizeMenuIcons(menus: any[], depth = 0): any[] {
    return (menus || []).map((menu) => {
        const next: any = { ...menu }
        next.meta = menu.meta ? { ...menu.meta } : {}
        if (menu.children?.length) {
            next.children = normalizeMenuIcons(menu.children, depth + 1)
        }
        // 三级及更深：不显示左侧图标
        if (depth >= 2) {
            next.meta.icon = ''
            return next
        }
        const needIcon = depth > 0 || !menu.children?.length
        if (needIcon && !next.meta.icon) {
            next.meta.icon = pickMenuIcon(String(next.meta.title || ''))
        }
        return next
    })
}

/**
 * 移除默认「用户列表」菜单项
 *
 * 背景：「用户列表」与业务「客户列表」是同一数据概念（平台注册用户即客户），
 * 二者并存会造成同一数据出现两个导航入口。故在融合阶段剔除默认「用户列表」，
 * 统一以业务「客户列表」承载。该菜单来自后端默认菜单，本地无法改后端，故前端过滤。
 */
function removeDefaultUserList(menus: any[]): any[] {
    return (menus || [])
        .filter((menu) => (menu.meta?.title || '').trim() !== '用户列表')
        .map((menu) => {
            const next: any = { ...menu }
            next.meta = menu.meta ? { ...menu.meta } : menu.meta
            if (menu.children?.length) {
                next.children = removeDefaultUserList(menu.children)
            }
            return next
        })
}

/**
 * 移除后台模板自带的冗余菜单
 *
 * 背景：本系统在 likeadmin 模板基础上二次开发，后端下发了若干与本业务无关的模板样例菜单，
 * 本地无法改后端，故在融合阶段统一过滤（与 removeDefaultUserList 同一套做法）。
 * 剔除项：
 * - 「存储设置」「热门搜索」「系统维护」：模板样例功能，本项目不使用（对应 views/setting/storage、
 *   views/setting/search、views/setting/system）。
 * - 模板自带样例「工作台」：标题为工作台 / 首页 / 控制台，且**不是**本项目业务路由（非 /hx/*）。
 *   本项目自定义业务工作台（`/hx/dashboard`，标题同为「工作台」）必须保留，故以路径前缀区分。
 */
const REMOVED_TEMPLATE_TITLES = ['存储设置', '热门搜索', '系统维护']
const REMOVED_TEMPLATE_PATHS = ['/setting/storage', '/setting/search', '/setting/system']

function isRemovableTemplateMenu(menu: any): boolean {
    const title = String(menu.meta?.title || '').trim()
    if (REMOVED_TEMPLATE_TITLES.includes(title)) return true
    const path = String(menu.path || '')
    if (REMOVED_TEMPLATE_PATHS.some((p) => path.includes(p))) return true
    // 模板样例工作台：标题命中，且非本项目业务路由（保留 /hx/dashboard 自定义工作台）
    if (/工作台|首页|控制台/.test(title) && !path.startsWith('/hx')) return true
    return false
}

function removeTemplateMenus(menus: any[]): any[] {
    return (menus || [])
        .filter((menu) => !isRemovableTemplateMenu(menu))
        .map((menu) => {
            const next: any = { ...menu }
            next.meta = menu.meta ? { ...menu.meta } : menu.meta
            if (menu.children?.length) {
                next.children = removeTemplateMenus(menu.children)
            }
            return next
        })
}

/** 一级菜单排序：工作台固定第一，其后为业务菜单，最后是后台原有其余菜单 */
export function mergeHxMenus(baseMenus: any[], hxTree: any[]): any[] {
    const base = removeTemplateMenus(removeDefaultUserList(cloneMenus(baseMenus)))
    const standalone: any[] = []
    let userHost: any = null

    hxTree.forEach((node: any) => {
        const hostTitle = node.meta?.hostTitle
        const children = cloneMenus(node.children || [])
        const host = hostTitle
            ? base.find((menu: any) => (menu.meta?.title || '').trim() === hostTitle)
            : null
        if (host) {
            // 注入子项（children 可能为空：该角色下没有可见业务节点，此时只保留排序规则）
            if (children.length) {
                const existed = new Set((host.children || []).map((item: any) => item.path))
                const add = children.filter((item: any) => !existed.has(item.path))
                if (add.length) {
                    host.children = host.children ? host.children.slice() : []
                    const insert = node.meta?.hostInsert
                    const at =
                        typeof insert === 'number'
                            ? Math.min(insert, host.children.length)
                            : host.children.length
                    host.children.splice(at, 0, ...add)
                }
            }
            if (node.meta?.hostMoveTo === 1) userHost = host
            return
        }
        // 后台暂无该菜单（例如未登录的本地预览）→ 作为独立一级菜单兜底
        // 叶子节点（如工作台）本身没有 children，只要有可见性就保留
        if (children.length || !node.children) {
            standalone.push({ ...node, children })
        }
    })

    // 组装顺序：工作台（置顶）→ 业务菜单 → 用户管理（第二位）→ 后台原有其余菜单
    const result: any[] = []
    const used = new Set<any>()

    // 置顶菜单（meta.pinTop）：固定排在所有一级菜单最前面
    standalone.forEach((menu: any) => {
        if (menu.meta?.pinTop) {
            result.push(menu)
            used.add(menu)
        }
    })
    const dashboard = base.find((menu: any) => /工作台|首页|控制台/.test(menu.meta?.title || ''))
    if (dashboard) {
        result.push(dashboard)
        used.add(dashboard)
    }
    // 用户管理：注入成功时用宿主菜单；未登录兜底时用本地包装组
    const userEntry =
        userHost ||
        base.find((menu: any) => (menu.meta?.title || '').trim() === '用户管理') ||
        standalone.find((menu: any) => menu.meta?.hostTitle === '用户管理')
    if (userEntry) {
        result.push(userEntry)
        used.add(userEntry)
    }
    standalone.forEach((menu: any) => {
        if (!used.has(menu)) {
            result.push(menu)
            used.add(menu)
        }
    })
    base.forEach((menu: any) => {
        if (!used.has(menu)) {
            result.push(menu)
            used.add(menu)
        }
    })
    // 统一补全图标：保证每一条二级菜单左侧都有图标（含上线后后端下发的菜单）
    return normalizeMenuIcons(result)
}
