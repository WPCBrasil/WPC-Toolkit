# PRD — WPC Hub Extension

**Versão:** 3.0.0  
**Data:** 2026-06-15  
**Time:** WPC — Web Production Center, Samsung  
**Status:** Em planejamento

---

## 1. Visão Geral

### Problema

O time de QA do WPC opera com duas extensões separadas — **WPC Toolkit** (6 módulos) e **SnapSlide QA** (envio de prints para slides) — além de processos manuais para auditar links, textos cortados, CTAs e capturas de tela. Isso gera:

- Sobrecarga de instalação e manutenção (2 extensões)
- Falta de padronização em auditorias visuais
- Perda de tempo em verificações manuais repetitivas
- Nenhuma automação para detectar problemas de link, overflow e CTA

### Solução

Unificar as duas extensões em uma única — **WPC Hub** — e adicionar quatro novos módulos de auditoria automática. Uma instalação, zero alternância, cobertura completa de QA.

### Usuários-alvo

Analistas de QA do Web Production Center Samsung (LATAM: BR, CO, CL, MX, PE, AR, UY, PY).

---

## 2. Objetivos

| Objetivo | Métrica de Sucesso |
|----------|-------------------|
| Eliminar a necessidade de ter duas extensões | 1 extensão substitui WPC Toolkit + SnapSlide |
| Reduzir tempo de auditoria manual de links e CTAs | Tempo de checagem de links reduz em 80% |
| Automatizar detecção de textos cortados | 0 falsos negativos óbvios em testes internos |
| Suportar Chrome e Edge (e Firefox no futuro) | Funcional nos dois browsers do time |
| Manter compatibilidade com fluxos existentes | Report, Checklist, QuickText sem regressões |

---

## 3. Escopo

### ✅ Dentro do escopo

- Unificação do WPC Toolkit e SnapSlide QA em uma única extensão
- Screenshot Engine (captura full-page desktop + mobile)
- Text Overflow Detector
- CTA Audit
- Link Audit
- Compatibilidade cross-browser: Chrome e Edge (Manifest V3)
- Instalação manual (não publicada na Web Store)

### ❌ Fora do escopo

- Publicação na Chrome Web Store
- Suporte a Safari
- Backend próprio (continua usando Google Apps Script existente)
- Autenticação de usuário (continua usando username salvo localmente)
- Integração com Jira API
- Testes automatizados E2E

---

## 4. Módulos e Requisitos

### 4.1 Módulos Herdados (sem regressão)

#### Report
- Captura a URL do ticket Jira ativo (deve ser `jira.secext.samsung.net/browse/WSC*`)
- Envia para Google Sheets via Apps Script: category, sub, status, publisherError, pendingCustomer, reason, qa, comments, date, ticketUrl
- Username salvo localmente com `chrome.storage.local`

#### Checklist
- Requer aba ativa com ticket Jira no formato `WSC########-#####`
- Seleciona template (Standard, FOOTER, GNB, HOME, OFFER, PCD, PDP, PF, PFS, Redirect)
- Gera XLSX nomeado: `QA_Prod_{ticket}_{username}_{YYMMDD}.xlsx`

#### QuickText
- Templates: Approved, Athena N/A, EOL, Rejected, Athena Fail, Published, Non Published, ShopApp Rejected
- Injeta `{user_name}` automaticamente
- Fecha popup 1 segundo após copiar

#### SnapSlide
- Cole de imagem via Ctrl+V em canvas
- Campos: ID da apresentação, tipo de página, categoria do erro, descrição
- Categorias: HDR_ISSUE, SEO_PROBLEM, GAL_ISSUE, TRN_ISSUE, FEA_ISSUE, BLK_ISSUE, AST_ISSUE, REG_ISSUE, MISS_ISSUE
- Envia para Google Slides via Apps Script

#### CountryScan
- Detecta: htmlLang, metaLang, ogLocale, título, URL, metaDescription, canonical
- Países: br, co, cl, mx, pe, ar, uy, py, latin, latin_en
- QA Tools: Verificação de país nos assets (img src) e nos CTAs (a href)
- Destaca elementos com problema na página

#### ShopApp Helper
- Injetado em `opstools-p1-*.ecom-qa.samsung.com` (br, pe, cl, co, mx)
- Ações: Add/Remove Border, Show/Hide Titles, Show/Hide Expired
- Widget Organizer (automático): badges numerados + botão de data

---

### 4.2 Módulos Novos

#### Screenshot Engine

**O que faz:** Captura a página inteira em duas condições — viewport desktop e viewport mobile simulado — e disponibiliza as imagens para download ou envio.

**Requisitos funcionais:**
- Captura full-page (scroll automático + stitch) em viewport 1920×1080 (desktop)
- Captura full-page em viewport 390×844 com UA móvel simulado (mobile)
- Botão "Capturar Desktop" e "Capturar Mobile" separados
- Preview da imagem no popup após captura
- Botão de download da imagem (PNG)
- Botão "Enviar para SnapSlide" — preenche automaticamente o canvas do módulo SnapSlide com a imagem capturada

**Restrições:**
- Usar `chrome.tabs.captureVisibleTab` para captura de viewport
- Scroll automático via `chrome.scripting.executeScript` para captura full-page
- Simulação mobile via `chrome.debugger` com `Emulation.setDeviceMetricsOverride` (ou via content script que redimensiona viewport)

**Fluxo do usuário:**
1. Abre a aba Screenshot
2. Clica em "Capturar Desktop" ou "Capturar Mobile"
3. Extensão injeta script, faz scroll e captura seção por seção
4. Preview aparece no popup
5. Usuário baixa ou envia para SnapSlide

---

#### Text Overflow Detector

**O que faz:** Varre todos os elementos de texto da página e identifica casos onde o texto está visualmente cortado (overflow oculto com conteúdo excedente).

**Requisitos funcionais:**
- Detecta elementos onde `scrollHeight > clientHeight` ou `scrollWidth > clientWidth` com `overflow: hidden` ou `overflow: clip`
- Lista os elementos detectados com: tag HTML, trecho de texto, seletor CSS, e coordenadas aproximadas na página
- Botão "Destacar na página" — adiciona borda vermelha nos elementos com overflow
- Botão "Limpar destaques" — remove as bordas
- Exportar resultado como texto copiável

**O que NÃO detectar (falsos positivos a evitar):**
- Elementos com `visibility: hidden` ou `display: none`
- Elementos fora do viewport por design (ex: carrosséis)
- Elementos com dimensão 0

**Fluxo do usuário:**
1. Abre a aba Text Overflow
2. Clica em "Escanear Página"
3. Lista de elementos com overflow aparece no popup
4. Clica em "Destacar" para ver na página

---

#### CTA Audit

**O que faz:** Escaneia todos os CTAs da página (links e botões) e identifica problemas que impactam conversão e rastreamento.

**Requisitos funcionais:**
- **CTA vazio:** `<a>` ou `<button>` com `innerText.trim() === ''` e sem `aria-label`
- **URL com espaço:** `href` contém ` ` (espaço literal) ou `%20` em posição inesperada (fora de parâmetros conhecidos)
- **Sem analytics:** link sem `utm_source`, `utm_medium`, `utm_campaign`, `cid=`, ou atributo `data-analytics-*` / `data-tracking-*`
- Lista cada problema com: tipo de problema, texto do CTA, href, seletor CSS
- Botão "Destacar CTAs problemáticos na página" (borda laranja)
- Exportar lista como texto copiável

**Fluxo do usuário:**
1. Abre a aba CTA Audit
2. Clica em "Auditar CTAs"
3. Lista agrupada por tipo de problema aparece
4. Pode clicar para destacar na página

---

#### Link Audit

**O que faz:** Valida se os links da página seguem a regra de abertura: samsung.com na mesma aba, externos em nova aba.

**Requisitos funcionais:**

Regra de negócio:
- Link cujo hostname termina em `.samsung.com` (qualquer subdomínio — www, ambientes de teste, CDNs) → deve ter `target="_self"` ou target ausente (mesma aba) ✅
- Qualquer outro href externo (não-samsung) → deve ter `target="_blank"` ✅
- Detecção: `new URL(href).hostname.endsWith('.samsung.com')` — cobre produção e QA sem hardcode de subdomínio
- Violação: link samsung.com com `target="_blank"` → reportar como erro
- Violação: link externo sem `target="_blank"` → reportar como erro
- Links `#anchor`, `javascript:`, `mailto:`, `tel:` → ignorar

**Saída:**
- Contagem: total de links, links samsung.com, links externos, violações
- Lista de violações: href, texto do link, target atual, target esperado, seletor CSS
- Botão "Destacar violações na página" (borda vermelha)
- Exportar como texto copiável

**Fluxo do usuário:**
1. Abre a aba Link Audit
2. Clica em "Auditar Links"
3. Painel com resumo + lista de violações
4. Destaca na página ou exporta

---

## 5. UX e Interface

### Estrutura de abas

```
[ Report ] [ Checklist ] [ QuickText ] [ SnapSlide ] [ CountryScan ] [ ShopApp ]
[ Screenshot ] [ Text Overflow ] [ CTA Audit ] [ Link Audit ]
```

Abas organizadas em duas linhas se necessário, ou scroll horizontal.

### Popup

- Largura: 480px (ligeiro aumento do WPC Toolkit para acomodar novos módulos)
- Altura: auto, máximo 600px com scroll interno
- Tema: escuro, Samsung design tokens (azul #1428A0 como accent)
- Feedback visual: spinners durante operações, toast de sucesso/erro

### Resultados de auditoria

- Cada módulo novo mostra: contador de problemas (vermelho se > 0, verde se 0)
- Lista expansível com detalhes de cada item
- Botões de ação por item (destacar, copiar)

---

## 6. Requisitos Técnicos

### Compatibilidade

| Browser | Versão mínima | Status |
|---------|--------------|--------|
| Chrome | 114+ | ✅ Obrigatório |
| Edge | 114+ | ✅ Obrigatório |
| Firefox | 115+ | 🔜 Futuro (v3.1) |

### Permissões (manifest)

```json
"permissions": [
  "activeTab",
  "scripting",
  "storage",
  "tabs",
  "clipboardWrite",
  "webNavigation",
  "debugger"
]
```

- `debugger`: necessário para simulação de viewport mobile no Screenshot Engine

### APIs externas mantidas

| Serviço | Módulo | Endpoint |
|---------|--------|----------|
| Google Apps Script — Sheets | Report | SCRIPT_URL configurável |
| Google Apps Script — Slides | SnapSlide | GAS_URL configurável |

### Nenhuma dependência de CDN ou NPM em runtime

A extensão deve funcionar offline (exceto os envios para Google Apps Script).

---

## 7. Fora de escopo (explicitamente)

- Não há login, autenticação ou conta de usuário
- Não há sincronização entre máquinas (`chrome.storage.sync` apenas para preferências simples)
- Não há relatório PDF automático
- Não há integração com API do Jira
- Não há publicação na Web Store nesta versão

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| `chrome.debugger` requer aprovação do usuário | Alta | Informar usuário ao usar Screenshot mobile; fallback via CSS override |
| Full-page capture falha em páginas com lazy loading | Média | Adicionar delay configurável entre scrolls |
| Content scripts bloqueados por CSP da Samsung | Baixa | Usar `chrome.scripting.executeScript` que tem precedência sobre CSP |
| Quebra de compatibilidade com Firefox no futuro | Média | Usar `browser-polyfill.js` (WebExtensions) desde o início |

---

## 9. Changelog de Versões

| Versão | O que muda |
|--------|-----------|
| 3.0.0 | Unificação WPC Toolkit + SnapSlide + 4 novos módulos |
| 2.1.0 | WPC Toolkit — Widget Organizer |
| 2.0.0 | WPC Toolkit — unificação de 5 extensões |
| 4.1 | SnapSlide QA — versão independente |
