# PulseLens

以手機後鏡頭進行反射式光體積變化描記（PPG）的瀏覽器原型。影像只在裝置端處理，不會上傳。

## 功能

- 呼叫手機後鏡頭，裝置支援時自動開啟手電筒
- 即時 PPG 光強度波形、心率估算與訊號品質提示
- 響應式手機介面與基本 PWA 離線快取
- 不依賴框架或第三方套件，可直接部署至 GitHub Pages

## 本機執行

相機 API 只允許安全來源。電腦可使用 `localhost`：

```bash
python -m http.server 8000
```

開啟 `http://localhost:8000`。在手機測試時，請部署到 HTTPS 網站（例如 GitHub Pages），不要直接開啟 HTML 檔案。

## GitHub Pages

1. 建立 GitHub repository 並推送此專案。
2. 到 **Settings → Pages**。
3. Source 選擇 **Deploy from a branch**，選擇 `main` 與 `/ (root)`。
4. 等候部署後，以手機 Safari 或 Chrome 開啟 HTTPS 網址。

## 測量方式

使用食指指腹完整覆蓋後鏡頭和閃光燈，輕貼並保持 30 秒。若手機過熱，應立即停止。

## 限制與安全聲明

這是測試與研究原型，不是醫療器材，不能用於診斷、治療或緊急判斷。手機相機自動曝光、膚色、環境光、動作、鏡頭排列與裝置溫度都會影響結果。若需建立醫療或研究等級系統，必須以標準心電圖或經認證裝置進行受試者驗證，並完成隱私、資安與法規評估。

## License

建議發布前選定授權條款；開源專案通常可使用 MIT License。
