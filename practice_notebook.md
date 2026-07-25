## UV

<!-- Python 的套件管理工具，取代 pip/venv -->

### 安裝

```使用powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 基本使用

```powershell or Command Lite (命令提示字元or 終端機) 
uv init          # 建立新專案
uv add flask     # 安裝套件(option)
uv run main.py   # 執行腳本(option)
```

---

## Git

<!-- 版本控制工具，用來追蹤程式碼變更 -->

### 安裝

```powershell
# 下載安裝程式: https://git-scm.com/download/win
winget install Git.Git
```

---

## Jupyter Notebook

<!-- 互動式筆記本，適合資料分析與視覺化 -->

### 安裝

```powershell
pip install notebook        # 經典版 (option)
pip install jupyterlab      # 增強版（推薦）
```

### 啟動

```powershell
jupyter notebook            # 啟動經典版 (option)
jupyter lab                 # 啟動 JupyterLab
```

---

## Node.js

<!-- JavaScript 運行環境，用來跑前端/後端 JS 程式 -->

### 安裝

```powershell
# 下載安裝程式: https://nodejs.org
winget install OpenJS.NodeJS.LTS
註:通常下載下來後以windows介面安裝即可
```

### 基本使用

```powershell
node -v             # 查看版本
npm init -y         # 建立 package.json(option)
npm install express # 安裝套件 (option)
node app.js         # 執行腳本 (option)
```
