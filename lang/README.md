# 语言文件

每个页面在 `lang/<页面>/` 中各有 `zh_CN.json` 和 `en.json`。导航、页脚及页面描述位于 `lang/common/`。页面切换时，`i18n.js` 使用 `fetch` 动态加载当前页面和公共部分的 JSON，并保存用户选定的语言。

键使用 `所属.类别.名称` 格式，例如 `index.home_page.title`。两种语言的同一文件应保持完全相同的键。`zh_CN.json` 中的文本也用于定位原始页面的文字；修改 `design-data.js` 中的文字时，请同步更新对应的中文值。

通过 HTTP 访问时会动态加载 JSON。直接打开 `file://` 页面时，浏览器通常不允许读取本地 JSON，因此会加载从这些 JSON 生成的 `lang/offline-bundle.js`。修改语言文件后，请运行 `node scripts/render-static.mjs` 同步更新静态页面与本地文件语言包。
