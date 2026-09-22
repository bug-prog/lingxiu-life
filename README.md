# 靈修生活 — 靜態網站鏡像

呢個壓縮包係「靈修生活」Vite/React SPA 嘅**完整靜態鏡像**，可直接放上 GitHub Pages、Netlify 或其他開源靜態託管，亦適合本地離線預覽（聖經資料已內置）。

來源原站：<https://service-9785tony.ai.studio>

## 包含內容

| 路徑 | 說明 |
|------|------|
| `index.html` | 入口頁（資源已改為相對路徑） |
| `assets/` | 打包後嘅 JS／CSS |
| `data/cuv.json` | 和合本聖經 JSON（離線閱讀用） |
| `fonts/` | Noto Sans TC／Noto Serif TC 本地 woff2 同 `fonts.css` |

## 解壓同本地預覽

解壓後，**網站根目錄就係解壓出來嘅資料夾**（頂層應見到 `index.html`）。

因為係 SPA／ES module，建議用本地 HTTP server，唔好直接用 `file://` 開：

```bash
# 方法一（推薦）
npx --yes serve .

# 方法二
python3 -m http.server 8080
```

然後用瀏覽器打開提示嘅網址（例如 `http://localhost:3000` 或 `http://localhost:8080`）。

## 部署 GitHub Pages

1. 新建一個 GitHub repository，將解壓後嘅檔案全部 commit 上去（或推去 `gh-pages` 分支）。
2. 喺 repo **Settings → Pages** 選擇來源分支同根目錄 `/`。
3. 本包已用**相對路徑**（`./assets/...`、`./data/cuv.json`、`./fonts/...`），所以無論係 user site（`username.github.io`）定 project site（`username.github.io/repo-name/`）都可以用；唔使再改 `base`。

亦可喺 GitHub 網頁用「Upload files」直接上傳解壓後嘅內容。

## 部署 Netlify

1. 解壓本 zip。
2. 登入 [Netlify](https://www.netlify.com/)，用 **Deploy manually** 將整個資料夾（或再打一次 zip）拖曳上去。
3. 唔使 build command；publish directory 就係資料夾根目錄。

其他靜態託管（Cloudflare Pages、Surge、Tiiny Host 等）同樣：上傳根目錄、無需 build。

## 離線能力說明

| 功能 | 離線？ | 備註 |
|------|--------|------|
| 聖經閱讀（和合本） | ✅ 可以 | `data/cuv.json` 已 vendor；JS 改為 fetch `./data/cuv.json` |
| 介面字體（Noto Sans／Serif TC） | ✅ 可以 | 已下載 Google Fonts 引用嘅全部 woff2 子集到 `fonts/` |
| 粵語語音朗讀 | ⚠️ 視裝置 | 用瀏覽器 `speechSynthesis`；離線／部份裝置可能無粵語（`zh-HK`）聲線 |
| 靈修日記／背誦等本機狀態 | ✅ 視實作 | 依賴瀏覽器本機儲存（如有）；唔依賴外部 API |

### 語音同其他依賴

- **語音**：僅使用瀏覽器內建 Web Speech API（`speechSynthesis`），**無** OpenAI、ElevenLabs 或其他雲端 TTS。
- **網絡請求**：除原本 CDN 聖經 URL 已改為本地外，JS 內未發現其他業務 API（無 openai／自架後端等）。`react.dev/errors/` 僅係開發錯誤訊息連結字串，唔會影響正常使用。
- **原站**：無 favicon／web manifest／額外圖片 chunk；本鏡像同原站 HTML 一致，只補本地字體同聖經資料。

## 授權同來源註記

- 應用鏡像來源：<https://service-9785tony.ai.studio>
- 聖經 JSON：<https://github.com/MaatheusGois/bible>（`versions/zh/cuv.json`）
- 字體：Google Fonts — [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)、[Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC)（SIL Open Font License）

本靜態包僅方便託管同離線使用；請自行遵守原站同各資源授權。
