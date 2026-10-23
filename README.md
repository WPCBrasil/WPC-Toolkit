[English](#english) · [Português](#português)

---

<a name="english"></a>

# WPC Hub

**Unified QA Suite · Chrome Extension · Manifest V3**

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-compatible-brightgreen)
![Edge](https://img.shields.io/badge/Edge-compatible-brightgreen)
![Firefox](https://img.shields.io/badge/Firefox-compatible-brightgreen)
![MV3](https://img.shields.io/badge/Manifest-V3-blueviolet)

WPC Hub is a unified browser extension that consolidates all QA tools used by the WPC QA team into a single interface. It merges the original WPC Toolkit (6 modules) and SnapSlide QA into one Manifest V3 extension, and adds 4 new page auditing modules.

No build step required — the extension runs directly from source files.

---

## Features

### 📊 Reporting

| Module | Description |
|--------|-------------|
| **Report** | Sends structured QA reports (category, status, country, comments) to Google Sheets via Apps Script |
| **Checklist** | Generates pre-filled `.xlsx` QA checklist files named with your QA ID and date |
| **QuickText** | One-click copying of pre-written QA comment templates with `{user_name}` placeholder support |
| **Screenshot** | Captures the visible viewport of the active tab; download as PNG or copy to clipboard |
| **SnapSlide** | Pastes a screenshot from clipboard and sends it with error metadata to Google Slides |

### 🔍 QA & Validation

| Module | Description |
|--------|-------------|
| **Content Scan** | Detects page language, country, script composition, and QA-specific issues (CTA country mismatch, asset country mismatch) |
| **CTA Check** | Unified page audit — one "Scan Page" click runs: CTA violations (empty, missing link, malformed URL), link target behavior validation, and **Check My Links** (HTTP status of every link, runs in background). Results appear in 3 collapsible accordion panels after the background check finishes. |
| **Link Check** | Standalone link `target` validator — internal samsung.com links must open in the same tab, external links in a new tab |
| **Text Clipping** | Detects visually truncated words using language-specific analysis (PT-BR, ES-ES, EN-US) |
| **Mobile View** | Opens a side panel with the current page rendered at a 390×844 px mobile viewport |


---

## Installation

### Chrome / Edge

1. Download or clone this repository
2. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `wpc-hub/` folder
6. The WPC Hub icon appears in your browser toolbar

After editing any source file, click the **reload** button on the extensions page and reopen the popup to apply changes.

### Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file inside `wpc-hub/`

> Firefox loads the extension temporarily — it must be reloaded after each browser restart.

---

## Initial Setup

Before using the extension, configure your account information via **Settings**:

1. Open the popup and select the **Reporting** group
2. Click the **⚙ gear icon** in the top-right corner of the header
3. Fill in the fields below and click **Save Settings**

| Field | Used in | Description |
|-------|---------|-------------|
| **QA Username** | Report, QuickText | Your team username; auto-fills fields and replaces `{user_name}` in templates |
| **QA ID** | Checklist | Used in the generated filename: `QA_ID_YYMMDD_template.xlsx` |
| **Report — Apps Script URL** | Report | Google Apps Script endpoint that writes reports to Google Sheets |
| **SnapSlide — Apps Script URL** | SnapSlide | Google Apps Script endpoint that inserts screenshots into Slides |
| **SnapSlide — Presentation ID** | SnapSlide | ID of the target Google Slides presentation (found in the Slides URL) |

---

## Module Reference

| Module | Group | Requires Setup | Key Action |
|--------|-------|---------------|------------|
| Report | Reporting | Apps Script URL, Username | Fill form → Send Report |
| Checklist | Reporting | QA ID | Select template → Create → Download |
| QuickText | Reporting | Username | Click template → auto-copies to clipboard |
| Screenshot | Reporting | — | Capture Full Page → Download / Copy |
| SnapSlide | Reporting | Apps Script URL, Presentation ID | Ctrl+V screenshot → Send to Slides |
| Content Scan | QA & Validation | — | Select language → Scan |
| CTA Check | QA & Validation | — | Scan Page → accordion panels (CTA / Links / Check My Links) |
| Link Check | QA & Validation | — | Audit Links → Scroll to violation |
| Text Clipping | QA & Validation | — | Scan Page → Highlight clipped elements |
| Mobile View | QA & Validation | — | Opens side panel at 390 px viewport |

---

## Project Structure

```
wpc-hub/
├── manifest.json               # Manifest V3 — cross-browser
├── popup.html                  # Main popup shell (tab groups)
├── popup.css                   # Design system — dark/light theme
├── popup.js                    # Orchestrator — loads all modules
├── docs.html                   # Built-in documentation page
├── docs.css                    # Documentation styles
├── docs.js                     # Documentation i18n (EN/PT/ES/KO)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── models/                     # XLSX checklist templates
├── modules/                    # One JS file per module
│   ├── report.js
│   ├── checklist.js
│   ├── quicktext.js
│   ├── snapslide.js
│   ├── countryscan.js
│   ├── screenshot.js
│   ├── text-overflow.js
│   ├── cta-audit.js
│   ├── link-audit.js
│   └── settings.js
└── scripts/                    # Content scripts injected into pages
    ├── background.js           # Service worker
    ├── countryscan-content.js
    ├── screenshot-content.js
    ├── text-overflow-content.js
    ├── cta-audit-content.js
    ├── link-audit-content.js
    ├── widget-organizer.js
```

---

## Tech Stack

- **Manifest V3** — Service Worker (no background page), `chrome.scripting`, `chrome.sidePanel`
- **Vanilla JS / CSS / HTML** — no framework, no build step, no dependencies
- **`chrome.storage.local`** — for all persistence (settings, theme preference)
- **Google Apps Script** — serverless backend for Sheets (Report) and Slides (SnapSlide)
- **WebExtensions API** — compatible with Chrome, Edge, and Firefox via polyfill

---

## Development

**Inspect the popup:**
Right-click the extension icon → **Inspect popup** → DevTools opens attached to the popup.

**Inspect the service worker:**
Go to `chrome://extensions` → click **Service Worker** next to WPC Hub.

**Package for distribution:**
```bash
zip -r wpc-hub-v3.0.0.zip manifest.json popup.html popup.css popup.js docs.html docs.css docs.js icons/ models/ modules/ scripts/
```

---

## In-App Documentation

WPC Hub includes a built-in documentation page with descriptions, setup instructions, and step-by-step guides for every module — available in **English, Portuguese, Spanish, and Korean**.

To open it: **Settings (⚙) → View Documentation**

---

<a name="português"></a>

# WPC Hub

**Suite Unificada de QA · Extensão para Chrome · Manifest V3**

![Version](https://img.shields.io/badge/versão-3.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-compatível-brightgreen)
![Edge](https://img.shields.io/badge/Edge-compatível-brightgreen)
![Firefox](https://img.shields.io/badge/Firefox-compatível-brightgreen)
![MV3](https://img.shields.io/badge/Manifest-V3-blueviolet)

O WPC Hub é uma extensão de navegador unificada que consolida todas as ferramentas de QA do time WPC em uma única interface. Reúne o WPC Toolkit original (6 módulos) e o SnapSlide QA em uma única extensão Manifest V3, adicionando 4 novos módulos de auditoria de página.

Não há etapa de build — a extensão roda diretamente a partir dos arquivos fonte.

---

## Recursos

### 📊 Relatórios

| Módulo | Descrição |
|--------|-----------|
| **Report** | Envia relatórios de QA estruturados (categoria, status, país, comentários) para o Google Sheets via Apps Script |
| **Checklist** | Gera arquivos `.xlsx` de checklist de QA pré-preenchidos, nomeados com seu QA ID e a data atual |
| **QuickText** | Cópia com um clique de templates de comentários de QA com suporte ao marcador `{user_name}` |
| **Screenshot** | Captura o viewport visível da aba ativa; disponível para download como PNG ou cópia para área de transferência |
| **SnapSlide** | Cola um screenshot da área de transferência e o envia com metadados de erro para o Google Slides |

### 🔍 QA & Validação

| Módulo | Descrição |
|--------|-----------|
| **Content Scan** | Detecta idioma, país, composição de script e problemas específicos de QA (links de CTA/assets com país incorreto) |
| **CTA Check** | Auditoria unificada de página — um clique em "Scan Page" executa: violações de CTA (vazio, link ausente, URL mal formada), validação de comportamento de target de links, e **Check My Links** (status HTTP de todos os links, roda em segundo plano). Resultados aparecem em 3 painéis de acordeão recolhíveis após a verificação finalizar. |
| **Link Check** | Validador independente de `target` — links samsung.com devem abrir na mesma aba, externos em nova aba |
| **Text Clipping** | Detecta palavras truncadas visualmente usando análise linguística específica (PT-BR, ES-ES, EN-US) |
| **Mobile View** | Abre um painel lateral com a página atual renderizada em viewport mobile de 390×844 px |


## Instalação

### Chrome / Edge

1. Faça o download ou clone este repositório
2. Abra `chrome://extensions` (Chrome) ou `edge://extensions` (Edge)
3. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `wpc-hub/`
6. O ícone do WPC Hub aparece na barra de ferramentas do navegador

Após editar qualquer arquivo fonte, clique no botão **recarregar** na página de extensões e reabra o popup para aplicar as alterações.

### Firefox

1. Abra `about:debugging`
2. Clique em **Este Firefox**
3. Clique em **Carregar extensão temporária**
4. Selecione o arquivo `manifest.json` dentro da pasta `wpc-hub/`

> O Firefox carrega a extensão temporariamente — ela precisa ser recarregada após cada reinicialização do navegador.

---

## Configuração Inicial

Antes de usar a extensão, configure suas informações de conta via **Configurações**:

1. Abra o popup e selecione o grupo **Reporting**
2. Clique no **ícone de engrenagem ⚙** no canto superior direito do cabeçalho
3. Preencha os campos abaixo e clique em **Save Settings**

| Campo | Usado em | Descrição |
|-------|----------|-----------|
| **QA Username** | Report, QuickText | Seu nome de usuário no time; preenche campos automaticamente e substitui `{user_name}` nos templates |
| **QA ID** | Checklist | Usado no nome do arquivo gerado: `QA_ID_YYMMDD_template.xlsx` |
| **Report — Apps Script URL** | Report | Endpoint do Google Apps Script que escreve relatórios no Google Sheets |
| **SnapSlide — Apps Script URL** | SnapSlide | Endpoint do Google Apps Script que insere screenshots no Slides |
| **SnapSlide — Presentation ID** | SnapSlide | ID da apresentação Google Slides de destino (encontrado na URL do Slides) |

---

## Referência de Módulos

| Módulo | Grupo | Requer Configuração | Ação Principal |
|--------|-------|---------------------|----------------|
| Report | Relatórios | URL do Apps Script, Username | Preencher formulário → Send Report |
| Checklist | Relatórios | QA ID | Selecionar template → Create → Download |
| QuickText | Relatórios | Username | Clicar no template → copia automaticamente |
| Screenshot | Relatórios | — | Capture Full Page → Download / Copy |
| SnapSlide | Relatórios | URL do Apps Script, Presentation ID | Ctrl+V screenshot → Send to Slides |
| Content Scan | QA & Validação | — | Selecionar idioma → Scan |
| CTA Check | QA & Validação | — | Scan Page → painéis acordeão (CTA / Links / Check My Links) |
| Link Check | QA & Validação | — | Audit Links → rolar até a violação |
| Text Clipping | QA & Validação | — | Scan Page → destacar elementos cortados |
| Mobile View | QA & Validação | — | Abre painel lateral com viewport de 390 px |
---

## Estrutura do Projeto

```
wpc-hub/
├── manifest.json               # Manifest V3 — cross-browser
├── popup.html                  # Shell principal do popup (grupos de abas)
├── popup.css                   # Design system — tema escuro/claro
├── popup.js                    # Orquestrador — carrega todos os módulos
├── docs.html                   # Página de documentação integrada
├── docs.css                    # Estilos da documentação
├── docs.js                     # i18n da documentação (EN/PT/ES/KO)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── models/                     # Templates XLSX de checklist
├── modules/                    # Um arquivo JS por módulo
│   ├── report.js
│   ├── checklist.js
│   ├── quicktext.js
│   ├── snapslide.js
│   ├── countryscan.js
│   ├── screenshot.js
│   ├── text-overflow.js
│   ├── cta-audit.js
│   ├── link-audit.js
│   └── settings.js
└── scripts/                    # Content scripts injetados nas páginas
    ├── background.js           # Service worker
    ├── countryscan-content.js
    ├── screenshot-content.js
    ├── text-overflow-content.js
    ├── cta-audit-content.js
    ├── link-audit-content.js
    ├── widget-organizer.js
```

---

## Stack Técnica

- **Manifest V3** — Service Worker (sem background page), `chrome.scripting`, `chrome.sidePanel`
- **Vanilla JS / CSS / HTML** — sem framework, sem etapa de build, sem dependências
- **`chrome.storage.local`** — para toda persistência (configurações, preferência de tema)
- **Google Apps Script** — backend sem servidor para Sheets (Report) e Slides (SnapSlide)
- **WebExtensions API** — compatível com Chrome, Edge e Firefox via polyfill

---

## Desenvolvimento

**Inspecionar o popup:**
Clique com o botão direito no ícone da extensão → **Inspecionar popup** → DevTools abre vinculado ao popup.

**Inspecionar o service worker:**
Acesse `chrome://extensions` → clique em **Service Worker** ao lado do WPC Hub.

**Empacotar para distribuição:**
```bash
zip -r wpc-hub-v3.0.0.zip manifest.json popup.html popup.css popup.js docs.html docs.css docs.js icons/ models/ modules/ scripts/
```

---

## Documentação Integrada

O WPC Hub inclui uma página de documentação embutida com descrições, instruções de configuração e guias passo a passo para cada módulo — disponível em **inglês, português, espanhol e coreano**.

Para abrir: **Configurações (⚙) → View Documentation**
