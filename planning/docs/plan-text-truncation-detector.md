# Plan: Text Truncation Detector

## Contexto

O módulo atual (`modules/text-overflow.js` + `scripts/text-overflow-content.js`) detecta apenas sinais visuais de overflow (ellipsis CSS, line-clamp, hard-clip) mas não identifica se o texto está de fato cortado no meio de uma palavra. O content script está incompleto (stub com `// TODO`). O PRD `prd-text-truncation-detector.md` especifica uma nova abordagem linguística que substitui completamente a implementação atual.

---

## Skills a Usar (nesta ordem)

| # | Skill | Quando Usar |
|---|-------|-------------|
| 1 | `brainstorming` | **Antes de qualquer código.** Validar decisões arquiteturais: onde rodar o spell-check (popup vs. service worker), estratégia de carregamento dos dicionários, fluxo de mensagens entre content script e popup. |
| 2 | `chrome-extension-developer` | Implementação: content script, módulo popup, manifest, comunicação MV3. |

> `frontend-architecture` é para Svelte 5 — não se aplica aqui.
> `product-manager` já cumpriu seu papel com o PRD existente.

---

## Arquitetura da Solução

```
[Usuário clica "Scan Page" no popup]
        │
        ▼
modules/text-overflow.js
  └─ chrome.scripting.executeScript → scripts/text-overflow-content.js
        │
        ├─ RF-1: DOM Scanner (TreeWalker + getComputedStyle)
        │        Filtra elementos com: overflow:hidden, text-overflow:ellipsis,
        │        max-height limitado, line-clamp, flex/grid com overflow oculto
        │
        ├─ Language detect: <html lang> → <meta content-language> → default pt-BR
        │
        └─ RF-2: Word Extraction (normaliza texto, extrai última palavra ≥3 chars)
                 └─ chrome.runtime.sendMessage({ action:'truncationCandidates', lang, candidates })
                          │
                          ▼
              modules/text-overflow.js (listener)
                ├─ RF-3: Spell-check via typo.js (lazy-load dicionário correto)
                ├─ RF-4: Pattern analysis (terminações raras por idioma)
                ├─ RF-5: Length heuristic (3-4 chars = +confiança)
                ├─ RF-6: Context enrichment (palavras antes da suspeita)
                └─ RF-7: Render no popup com confidence badge HIGH/MEDIUM
```

---

## Dependências Externas a Adicionar

| Arquivo | Origem | Destino |
|---------|--------|---------|
| `typo.min.js` | github.com/cfinke/Typo.js | `lib/typo.min.js` |
| `pt-BR.dic` + `pt-BR.aff` | LibreOffice/OpenOffice dictionaries | `lib/dictionaries/` |
| `es-ES.dic` + `es-ES.aff` | LibreOffice/OpenOffice dictionaries | `lib/dictionaries/` |
| `en-US.dic` + `en-US.aff` | LibreOffice/OpenOffice dictionaries | `lib/dictionaries/` |

Todos os arquivos em `lib/` precisam ser declarados em `web_accessible_resources` no `manifest.json` para que o popup possa fazer `fetch()` deles.

---

## Arquivos a Criar / Modificar

### `scripts/text-overflow-content.js` — reescrita completa

Atualmente é um stub vazio. Nova implementação:

**RF-1 — DOM Scanner**
- Usar `TreeWalker` para iterar text nodes (mais eficiente que `querySelectorAll` em loop)
- Para cada elemento pai, chamar `getComputedStyle` e verificar:
  - `overflow: hidden` ou `overflow-x/y: hidden`
  - `text-overflow: ellipsis`
  - `max-height` ou `height` fixo com conteúdo excedente
  - `-webkit-line-clamp` com overflow hidden
  - Elemento filho de flex/grid com `overflow: hidden`
- Meta de performance: < 500ms em páginas com 10k+ elementos

**Language Detection**
```
1. document.documentElement.lang (ex: "pt-BR")
2. document.querySelector('meta[http-equiv="content-language"]').content
3. Default: "pt-BR"
Normalização: "pt" → "pt-BR", "es" → "es-ES", "en" → "en-US"
```

**RF-2 — Word Extraction**
```
Para cada elemento suspeito:
1. Pegar innerText, normalizar whitespace
2. Remover pontuação final: . ! ? (exceto "...")
3. Fazer split por espaço, pegar última palavra
4. Validar: length >= 3, contém letra, não é número puro
5. Guardar contexto: 2 palavras anteriores
```

**Mensagem enviada:**
```json
{
  "action": "truncationCandidates",
  "lang": "pt-BR",
  "candidates": [
    {
      "selector": "body > section > p",
      "fullText": "...deixa as imag",
      "lastWord": "imag",
      "context": ["deixa", "as"]
    }
  ]
}
```

---

### `modules/text-overflow.js` — reescrita completa

Toda a lógica atual (overflow visual simples) é substituída.

**Confidence Scoring Pipeline:**
```
Passo inicial (base): spell-check falhou → conf = 0.60

RF-4 — Terminação rara por idioma:
  PT: termina em -g, -t, -p, -c, -n isolado → +0.25
  ES: termina em -g, -t, -p, -c isolado → +0.25
  EN: termina em -g, -t, -c isolado → +0.25

RF-5 — Comprimento:
  3-4 chars → +0.15
  5+ chars → +0.05

RF-6 — Contexto linguístico:
  Artigo/preposição antes (ex: "as", "para", "an") → +0.10

Threshold para exibir: confidence >= 0.70
HIGH: >= 0.85  |  MEDIUM: 0.70–0.84
```

**Carregamento de dicionários (lazy + cache em memória):**
```javascript
const dicCache = {};
async function getTypo(lang) {
  if (dicCache[lang]) return dicCache[lang];
  const base = chrome.runtime.getURL(`lib/dictionaries/${lang}`);
  const [aff, dic] = await Promise.all([
    fetch(`${base}.aff`).then(r => r.text()),
    fetch(`${base}.dic`).then(r => r.text()),
  ]);
  dicCache[lang] = new Typo(lang, aff, dic);
  return dicCache[lang];
}
```

**UI a renderizar:**
- Status: "Scanning…" → "X issues found" ou "No truncation detected"
- Lista de cards por issue:
  - Trecho de texto com palavra suspeita destacada
  - Badge: `HIGH` (vermelho) ou `MEDIUM` (amarelo)
  - CSS selector do elemento
- Botão "Highlight on Page": injeta `outline: 3px solid #FF5E5E` nos elementos detectados

---

### `manifest.json`

Adicionar em `web_accessible_resources`:
```json
{
  "resources": [
    "lib/typo.min.js",
    "lib/dictionaries/pt-BR.dic",
    "lib/dictionaries/pt-BR.aff",
    "lib/dictionaries/es-ES.dic",
    "lib/dictionaries/es-ES.aff",
    "lib/dictionaries/en-US.dic",
    "lib/dictionaries/en-US.aff"
  ],
  "matches": ["<all_urls>"]
}
```

---

### `popup.html` — tab "Text Clipping"

Substituir conteúdo atual do `tab-panel` de text-overflow por:
```
[ Scan Page ]
─────────────────────────────────
Status: "Ready" / "Scanning…" / "3 issues found"
─────────────────────────────────
┌─────────────────────────────────────────┐
│ [HIGH] "...deixa as imag"               │
│ lastWord: imag  |  body > section > p   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [MEDIUM] "...problemas para proce"      │
│ lastWord: proce  |  div.content > span  │
└─────────────────────────────────────────┘

[ Highlight on Page ]
```

---

### `popup.css`

Adicionar estilos para:
```css
.to-badge-high   { background: #FF5E5E; color: #fff; ... }
.to-badge-medium { background: #F5A623; color: #fff; ... }
.to-issue-card   { border, padding, radius, gap ... }
.to-last-word    { font-weight: bold; text-decoration: underline dotted; }
```

---

## Sequência de Implementação

```
Fase 1 — Dependências
  [1.1] Baixar typo.min.js → lib/typo.min.js
  [1.2] Baixar dicionários (pt-BR, es-ES, en-US) → lib/dictionaries/
  [1.3] Atualizar manifest.json (web_accessible_resources)

Fase 2 — Content Script
  [2.1] Reescrever scripts/text-overflow-content.js
        - DOM Scanner (TreeWalker + getComputedStyle)
        - Language detection
        - Word extraction
        - sendMessage com candidates

Fase 3 — Módulo Popup
  [3.1] Reescrever modules/text-overflow.js
        - Injeção do content script
        - Listener de mensagem
        - Carregamento lazy de typo.js + dicionários
        - Pipeline de confidence scoring
        - Render de resultados

Fase 4 — UI
  [4.1] Atualizar popup.html (tab Text Clipping)
  [4.2] Atualizar popup.css (badges, cards, estado vazio)
```

---

## Verificação End-to-End

1. Recarregar extensão em `chrome://extensions`
2. Abrir página PT-BR com `overflow: hidden` e texto truncado no meio de uma palavra
3. Clicar "Scan Page" → lista deve exibir issues HIGH/MEDIUM com confidence ≥ 0.70
4. Verificar que "Learn More", "Dr.", "etc." NÃO aparecem
5. Testar em página em ES (espanhol) e EN (inglês)
6. Clicar "Highlight on Page" → confirmar outline `#FF5E5E` nos elementos detectados
7. Verificar performance: scan deve completar em < 3 segundos em página típica

---

## O Que NÃO Mudar

- Estrutura de abas do popup (grupo QA & Validation permanece igual)
- Outros módulos (CTA Audit, Link Audit, CountryScan, etc.)
- Convenções de código do projeto (sem innerHTML com conteúdo externo, sem eval)
