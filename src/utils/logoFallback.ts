/**
 * 演示站图片资源兜底
 *
 * 背景：模板对接的演示站接口返回的历史图片资源已失效，网站信息 / 登录页等处的
 *      图片位会呈现「加载失败」，影响交付演示的观感。
 *
 * 处理：凡是「地址为空」或「原图加载失败」的图片位，统一替换为项目 logo
 *      （`public/logo.jpg`，地址随 vite base 拼接）。能正常显示的原图保持不动，
 *      因此后端接入真实资源后本兜底会自动失效，无需改动。
 *
 *      另有 FORCE_LOGO_FIELDS 白名单：命中的字段不看原图、一律用 logo（登录页左侧图
 *      login_image 即在此列）。
 *
 * 若需彻底关闭兜底：删除本文件，并移除以下两处调用
 *   - src/views/setting/website/information.vue（getData 内）
 *   - src/stores/modules/app.ts（getConfig 内）
 */

/**
 * 本地 logo 地址（public/logo.jpg）
 * 用 import.meta.env.BASE_URL 拼接，随 vite base 自动变化
 * （base 为 '/' 时得到 '/logo.jpg'，为 '/admin/' 时得到 '/admin/logo.jpg'）
 */
export const LOCAL_LOGO = `${import.meta.env.BASE_URL}logo.jpg`

/**
 * 是否强制全部替换为 logo
 * - false（默认）：仅替换「空地址」与「加载失败」的图片位，能正常显示的原图保留；
 * - true：不考虑原图能否显示，站内全部图片位一律用 logo 覆盖。
 */
export const FORCE_LOGO = false

/**
 * 强制使用本地 logo 的图片字段（无视原图是否可正常加载）
 * 当前：登录页广告图 login_image —— 登录页左侧图固定展示项目 logo。
 * 若以后要恢复后端配置的登录页广告图，把 login_image 从本数组移除即可。
 */
export const FORCE_LOGO_FIELDS: readonly string[] = ['login_image']

/** 站内所有图片字段名（后台设置 / 前台设置 / PC端设置） */
export const LOGO_IMAGE_FIELDS = [
    'web_favicon', // 后台-网站图标
    'web_logo', // 后台-网站LOGO
    'login_image', // 后台-登录页广告图
    'h5_favicon', // 前台-网站图标
    'shop_logo', // 前台-前台LOGO
    'pc_logo', // PC端-PC端LOGO
    'pc_ico' // PC端-网站图标
] as const

/** 探测单个图片地址是否可正常加载 */
export function canLoadImage(url: unknown): Promise<boolean> {
    return new Promise((resolve) => {
        if (!url || typeof url !== 'string') return resolve(false)
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
    })
}

/**
 * 对目标对象上的图片字段做兜底（就地修改）
 * @param target 数据对象（表单数据 / 站点配置）
 * @param fields 需要处理的字段，默认站内全部图片字段
 */
export async function applyLogoFallback(
    target: Record<string, any> | undefined | null,
    fields: readonly string[] = LOGO_IMAGE_FIELDS
): Promise<void> {
    if (!target) return
    await Promise.all(
        fields.map(async (key) => {
            const force = FORCE_LOGO || FORCE_LOGO_FIELDS.includes(key)
            const ok = force ? false : await canLoadImage(target[key])
            if (!ok) {
                target[key] = LOCAL_LOGO
            }
        })
    )
}
