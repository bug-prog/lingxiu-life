# 慢慢讀 · 福音神學陪伴閱讀

為希望減少閱讀負擔的繁體中文讀者設計，也適合有輕度讀寫困難的人使用。把《福音神學暨福音難題解答（修訂版）》第一部「神論」十四章，整理成一次一小段的閱讀空間。

## 已有功能

- 十四章淺白導讀：每章三張短解說卡，以及一題可重試的理解題。
- 原書第 44–174 頁完整 OCR 文字，拆成 931 張小卡；可直接跳至原書頁碼。
- 每章詞語解釋、全站詞語查找、章節搜尋及收藏。
- 語音朗讀目前的小段，支援暫停、繼續、停止及當前段落標亮。切換段落會停止，不會自動前進。
- 可調字級、行距、字距、暖紙色／白色／深色，以及專心閱讀模式。
- 本機儲存閱讀位置、完成章節、收藏及設定。不需要帳戶、API 金鑰、付費服務或建置工具。
- 鍵盤操作、可見焦點、跳過導覽、原生對話框、減少動畫偏好及手機版。

這是可自訂的閱讀工具，並非經臨床驗證的讀寫障礙介入；應邀請實際讀者試用再調整。

## 本機開啟

直接開啟 `index.html` 即可使用。內容由本地 JavaScript 檔提供，無須 fetch 或後端。

也可在這個資料夾啟動靜態伺服器：

```sh
python3 -m http.server 8080
```

然後開啟 `http://localhost:8080`。所有路徑為相對路徑，支援 GitHub Pages 的專案子路徑。

## 放上 GitHub Pages

1. 在 GitHub 建立一個儲存庫，例如 `gospel-reader`。
2. 把這個資料夾**裡面的檔案**上載至儲存庫根目錄，讓 `index.html` 位於根目錄。
3. 開啟儲存庫的 **Settings → Pages**。
4. 在 **Build and deployment** 選 **Deploy from a branch**，分支選 `main`，資料夾選 `/ (root)`，按 **Save**。
5. 等待部署完成，Pages 畫面會顯示網站網址。通常為 `https://你的帳號.github.io/gospel-reader/`。

操作說明參考 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

本交付只準備網站檔案，尚未建立 GitHub 儲存庫或公開部署。GitHub Pages 的方案和儲存庫可見性限制，請以 GitHub 當時的設定為準。

## 內容編輯與來源

- `index.html`：介面及對話框。
- `styles.css`：版面、主題、響應式設計及可讀性設定。
- `app.js`：操作、語音、詞語解釋及進度。
- `assets/lessons.json`：十四章手工編寫的淺白導讀及理解題，可直接修改。
- `assets/book-part-one.txt`：本次 PDF 整理文字，含封面、版權、序言及全書目錄。
- `scripts/build_content.py`：按原書頁碼分章及切段，保留文字，產生 `assets/content.js`。
- `assets/content.js`：網站直接讀取的內容資料；已產生，上載即可用。

修改原文或導讀後，在這個資料夾執行：

```sh
python3 scripts/build_content.py
```

產生器會檢查原文是否在分段過程中遺漏字元；不代表 OCR 已逐字校勘。原書正文跨頁斷句保留來源頁碼，不臆測補字。

### 編寫原則

「淺白導讀」以作者觀點為來源，並明確區分原文與導讀補充。每章先整理一個中心，再拆解概念，最後用生活例子或閱讀提示協助理解。例子不是證明，也不是原書引文。

本書的宗教比較、歷史及科學主張並未由網站逐項查證。導讀不把作者的科學論述寫成已確認的科學共識，也不把理解題當成信仰測試。三位一體等複雜題目僅作入門導讀，應回到原文和其他研究資料深入閱讀。

原書：吳主光著，《福音神學暨福音難題解答（修訂版）》，種籽出版社，2016 年 4 月修訂版。原書內容的版權屬原權利人；本專案不授予書籍的再發布權。公開上載包含全文的網站前，請確認你具有公開使用書籍內容的許可。

## 語音與資料

使用 Web Speech API，語音來自使用者裝置。優先選香港中文／粵語，再選台灣中文，並可手動選擇。實際語音清單及暫停行為依瀏覽器和系統而異；未安裝中文語音時會提示安裝。部分系統語音可能需要網絡，不能保證完全離線。

網站沒有分析追蹤或後端傳送。閱讀紀錄使用 `localStorage` 的 `slow-reader:v1`；清除網站資料、私密瀏覽結束、換瀏覽器或換裝置可能失去紀錄。儲存不可用時仍能閱讀，頁面會提示。file:// 的儲存行為依瀏覽器而異；正式使用以 HTTPS 網站為佳。

## 驗證

內容產生器會檢查十四章及原文完整性。`tests/smoke.cjs` 以 Playwright 驗證主要操作、儲存還原、鍵盤頁籤、手機版和語音控制模擬。需自行安裝 Node.js、Playwright 及其 Chromium 才能執行測試；日常使用和 GitHub Pages 不需要這些工具。

```sh
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 8080
# 另一個終端
node tests/smoke.cjs http://localhost:8080
```

測試模擬語音 API 以驗證控制流程，不等於在每款實機上確認中文發音。公開前仍建議由目標讀者及熟悉本書的人試讀。

閱讀設計參考：[W3C Clear and Understandable Content](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/)、[Use White Spacing](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p10-whitespace/)。
