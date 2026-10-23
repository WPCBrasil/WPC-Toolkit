# PRD: Extensão de Detecção de Textos Cortados

## 1. Visão Geral

**Nome do Projeto:** Text Truncation Detector  
**Objetivo:** Identificar automaticamente textos cortados (truncados) em páginas web para acelerar o processo de levantamento de conteúdo incompleto.  
**Usuário Principal:** Equipe de QA/Conteúdo que atualmente faz verificação visual manual.  
**Valor:** Automação de ~80% do processo de detecção manual, reduzindo tempo de análise.

---

## 2. Escopo

### Idiomas Suportados
- ✅ Português (Brasil)
- ✅ Espanhol (Argentina, Paraguai, Chile, México, Uruguai, Peru)
- ✅ Inglês (EUA, Reino Unido, Variantes)
- ✅ Inglês (Papua Nova Guiné, Panamá) - tratado como variante do inglês

### O que Detectar
- Textos que terminam abruptamente no meio de uma palavra
- Exemplos válidos:
  - `"deixa as imag"` → palavra incompleta: "imag"
  - `"Disculpe, tenemos problemas para proce"` → palavra incompleta: "proce"
  - `"This is an incomple"` → palavra incompleta: "incomple"

### O que NÃO Detectar
- Abreviações legítimas: "Sr.", "Dr.", "etc.", "COVID-19"
- Caracteres especiais/símbolos: "$", "€", "®"
- Números isolados
- Hashtags propositalmente abreviadas
- URLs truncadas
- Reticências legítimas: "..."
- Palavras realmente existentes que são curtas: "luz", "sol", "ato"

### Limites
- Não detecta se a página está em idioma desconhecido
- Não valida qual era a palavra original (só identifica suspeita)
- Pode ter falsos positivos com regionalismos/gírias não presentes no dicionário
- Não analisa conteúdo dentro de `<script>`, `<style>`, atributos HTML

---

## 3. Requisitos Funcionais

### RF-1: Detecção Visual Rápida
**Descrição:** Antes de qualquer análise, filtrar elementos que apresentam sinais visuais óbvios de truncamento.

**Critérios de Ativação:**
Elemento é candidato para análise se possui UMA OU MAIS das seguintes características:
```
1. CSS: overflow: hidden (em qualquer eixo)
2. CSS: text-overflow: ellipsis
3. CSS: max-width < calculado width do conteúdo
4. CSS: max-height < altura esperada do texto
5. DOM: Elemento dentro de flex/grid com overflow
6. DOM: Elemento com height/width fixo e overflow oculto
```

**Output:** Lista de elementos suspeitos para análise de conteúdo.

**Performance:** Deve ser feito em <50ms mesmo em páginas com 10k+ elementos.

---

### RF-2: Extração de Última Palavra
**Descrição:** Extrair a última palavra de texto de cada elemento suspeito.

**Regras de Extração:**
```
1. Normalizar espaços em branco (remover tabs, quebras de linha múltiplas)
2. Remover pontuação final legítima:
   - "texto." → "texto"
   - "texto!" → "texto"
   - "texto?" → "texto"
   - Exceção: se termina em "..." (reticências), é suspeito por padrão

3. Identificar última palavra:
   - Split por espaço
   - Última ocorrência = palavra candidata

4. Validações básicas:
   - Comprimento mínimo: 3 caracteres
   - Não é número puro
   - Contém pelo menos 1 letra
```

**Output:** String da última palavra candidata, posição no elemento.

**Exemplo:**
```
Input:  "Sinta-se dentro da partida. Em tempo real, a Inteligência Artificial equilibra e amplifica as vozes da torcida e deixa as imag"
Output: "imag" (4 chars)

Input:  "Disculpe, tenemos problemas para proce"
Output: "proce" (5 chars)
```

---

### RF-3: Validação Ortográfica (Spell-Check)
**Descrição:** Validar se a última palavra é reconhecida como válida no idioma detectado.

**Detalhes Técnicos:**

#### 3.1 Detecção de Idioma
Método: Analisar idioma da página UMA VEZ no início, em ordem de prioridade:
```
1. Atributo HTML: <html lang="pt-BR">
2. Meta tag: <meta http-equiv="content-language" content="pt">
3. Heurística: Analisar 3-5 primeiras palavras significativas com biblioteca de detecção
4. Default: Português (BR)
```

**Suporte Multi-Idioma:**
Se página contém múltiplos idiomas (ex: bilíngue português-espanhol):
- Detectar idioma dominante baseado em % de conteúdo
- Alternativamente: Rodar spell-check para todos os idiomas e marcar como "ambíguo" se falhar em 2+

#### 3.2 Spell-Check Local (typo.js ou equivalente)
```
Biblioteca: typo.js (aberta, suporta múltiplos dicionários)
Dicionários: Um por idioma
  - pt-BR.dic (Português Brasil)
  - es-ES.dic (Espanhol - generalista, cobre variantes)
  - en-US.dic (Inglês)

Resultado esperado:
  check("imag") → false (palavra inválida)
  check("image") → true (palavra válida)
  check("proce") → false (palabra inválida)
  check("procesar") → true (palabra válida)
```

**Performance:** Cada check deve ser <1ms.

---

### RF-4: Análise de Padrão de Terminação
**Descrição:** Enriquecer detecção validando padrões de terminação esperados por idioma.

**Padrões Válidos por Idioma:**

#### Português (Brasil)
```
Terminações COMUNS no final de palavras reais:
  -ção (ação, formação)
  -mente (realmente, felizmente)
  -agem (imagem, paisagem)
  -ismo (realismo, pragmatismo)
  -ado/-ado (cortado, fechado)
  -ido (partido, sentido)
  -able (agradável, variável)
  -ão (coração, refrão)
  -ista (jornalista, dentista)
  
Terminações RARAS/SUSPEITAS no final:
  -g (isolado: "imag", "parag")
  -t (isolado: "import", "depart")
  -p (isolado: "desen", "princ")
  -c (isolado: "proble", "abstra")
  -n (isolado: "questio", "açã")
  -r (isolado, pode ser válido em infinitivos)
```

#### Espanhol
```
Terminações COMUNS no final de palabras reales:
  -ción (acción, formación)
  -mente (realmente, felizmente)
  -ismo (realismo, pragmatismo)
  -ado/-ado (cortado, cerrado)
  -ido (partido, sentido)
  -able (agradable, variable)
  -ón (corazón, refrán)
  -ista (periodista, dentista)
  -dad (ciudad, libertad)
  -ez (rapidez, belleza)
  -ancia/-encia (importancia, existencia)

Terminaciones RARAS/SOSPECHOSAS:
  -g (aislado: "imag", "parag")
  -t (aislado: "import", "depart")
  -p (aislado: "desen", "princ")
  -c (aislado: "proble", "abstra")
```

#### Inglês
```
Terminações COMUNS no final de words:
  -ing (running, thinking)
  -tion (action, formation)
  -ment (development, government)
  -able/-ible (variable, possible)
  -ness (happiness, sadness)
  -ity (quality, ability)
  -ous (famous, dangerous)
  -ed (created, loved)
  -er (stronger, larger)
  -ly (really, quickly)
  -ful (beautiful, wonderful)
  -less (helpless, homeless)

Terminações RARAS/SUSPEITAS:
  -g (isolado: "runnin", "thinkin")
  -t (isolado: "import", "depart")
  -c (isolado: "logi", "speci")
  -e (isolado, pode ser válido: "the", "are")
```

**Aplicação:**
```
Se palavra = inválida no spell-check:
  Verificar terminação
  
  Se termina em padrão RARO:
    Confiança: ALTA (90%+)
  
  Se termina em padrão neutro:
    Confiança: MÉDIA (70-80%)
```

---

### RF-5: Análise de Comprimento
**Descrição:** Usar heurística de comprimento para aumentar confiança.

**Lógica:**
```
Se última palavra tem 3-4 caracteres:
  → Maior probabilidade de estar cortada (MIN 30% prob)
  
Se última palavra tem 5+ caracteres:
  → Pode estar cortada ou ser abreviação válida (MÉDIA conf)
  
Se última palavra tem 2 ou menos caracteres:
  → Ignorar (muito baixa confiança)
```

---

### RF-6: Enriquecimento com Contexto
**Descrição:** Reduzir falsos positivos validando contexto da palavra.

#### Contexto Linguístico
```
Analisar 2-3 palavras ANTES da palavra suspeita:

Português:
  "...deixa as imag" → artigo feminino "as" + nome incompleto = SUSPEITO
  "...leu um artigo" → palavra completa = não é suspeito

Espanhol:
  "...tenemos problemas para proce" → preposição + verbo incompleto = SUSPEITO
  "...proceso de transformación" → palavra completa = não é suspeito

Inglês:
  "...is an incomple" → artigo "an" + adj incompleto = SUSPEITO
  "...complete picture" → palavra completa = não é suspeito
```

#### Análise de Pontuação
```
Se palavra está antes de:
  . (ponto final) → pode ser abreviação válida
  , (vírgula) → provável continuar, pode ser cortado
  ! (exclamação) → pode ser cortado no meio
  ? (interrogação) → pode ser cortado no meio
  ; (ponto-vírgula) → pode ser cortado
  ... (reticências) → ALTAMENTE SUSPEITO (texto cortado)
```

---

### RF-7: Reportagem
**Descrição:** Coletar e estruturar dados para envio ao cliente.

**Estrutura de Dado:**
```json
{
  "timestamp": "2024-06-16T14:30:00Z",
  "pageUrl": "https://exemplo.com/pagina",
  "pageTitle": "Título da Página",
  "detectedLanguage": "pt-BR",
  "truncationIssues": [
    {
      "id": "truncation_001",
      "elementPath": "body > div.container > p#content",
      "elementXPath": "/html/body/div[1]/p[5]",
      "position": { "x": 120, "y": 450 },
      "truncatedText": "deixa as imag",
      "lastWord": "imag",
      "expectedWord": null,
      "confidence": 0.95,
      "confidenceLevel": "HIGH",
      "reasons": [
        "CSS overflow:hidden detected",
        "Word not found in dictionary",
        "Unusual termination pattern '-g'",
        "Article 'as' suggests noun follows"
      ],
      "context": {
        "fullElementText": "Sinta-se dentro da partida. Em tempo real, a Inteligência Artificial equilibra e amplifica as vozes da torcida e deixa as imag",
        "wordsBeforeTruncation": ["deixa", "as"],
        "elementWidth": "320px",
        "elementHeight": "auto",
        "cssOverflow": "hidden",
        "cssTextOverflow": "ellipsis"
      }
    }
  ],
  "summary": {
    "totalElementsAnalyzed": 1245,
    "elementsSuspicious": 87,
    "elementsWithTruncation": 3,
    "truncationRate": "0.24%"
  }
}
```

**Output Métodos:**
1. Console.log (para debug)
2. Enviar para servidor via POST
3. Armazenar em localStorage (para revisão offline)
4. Highlight visual na página (optional)

---

## 4. Requisitos Técnicos

### RT-1: Stack Tecnológico
```
Linguagem: JavaScript (ES6+)
Tipo: Browser Extension (Chrome/Firefox/Edge)
Empacotamento: Manifest V3

Dependências Externas:
  - typo.js (spell-checking)
  - Dicionários: pt-BR.dic, es-ES.dic, en-US.dic

Dependências Internas:
  - Biblioteca de detecção de idioma (lightweight)
  - Parser de CSS (usar getComputedStyle nativo)
```

### RT-2: Performance
```
Tempo máximo de análise por página: 3 segundos
  - Varredura de DOM: <500ms
  - Detecção de idioma: <100ms
  - Spell-check batch: <1500ms
  - Análise de contexto: <600ms
  - Serialização e envio: <300ms

Uso de memória: <50MB (incluindo dicionários em cache)

Compatibilidade:
  - Chrome 90+
  - Firefox 88+
  - Edge 90+
  - Safari 14+
```

### RT-3: Estrutura da Extensão
```
manifest.json
  ├─ content-scripts (roda na página)
  ├─ background-worker (processa dados)
  ├─ popup.html (UI de configuração)
  └─ options.html (configurações do usuário)

assets/
  ├─ dictionaries/
  │   ├─ pt-BR.dic
  │   ├─ pt-BR.aff
  │   ├─ es-ES.dic
  │   ├─ es-ES.aff
  │   ├─ en-US.dic
  │   └─ en-US.aff
  ├─ lang-detect.js
  ├─ spell-checker.js
  └─ pattern-analyzer.js

src/
  ├─ content.js (injeta na página)
  ├─ analyzer.js (lógica principal)
  ├─ dom-scanner.js (varredura visual)
  ├─ spell-checker-wrapper.js
  ├─ context-enricher.js
  ├─ reporter.js
  └─ config.js (idiomas, padrões, etc)
```

---

## 5. Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────┐
│ Usuário clica ícone da extensão em página web                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [1] Content Script executa na página                         │
│     - DOM está completo                                       │
│     - Acessa conteúdo da página                             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [2] DOM Scanner (RF-1)                                        │
│     - Varre todos elementos                                   │
│     - Filtra por sinais visuais: overflow, max-width, etc    │
│     - Output: ~50-150 elementos suspeitos (de 1k+)           │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [3] Language Detection (RF-4)                                 │
│     - Detecta idioma da página                               │
│     - Seleciona dicionário correto                           │
│     - Output: "pt-BR" / "es-ES" / "en-US"                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [4] Word Extraction (RF-2)                                    │
│     - Para cada elemento suspeito                            │
│     - Extrai última palavra                                   │
│     - Normaliza e valida                                     │
│     - Output: ["imag", "proce", "incomple", ...]            │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [5] Spell-Check Batch (RF-3)                                  │
│     - Passa todas palavras para typo.js                      │
│     - Verifica cada uma contra dicionário                    │
│     - Output: {word: "imag", isValid: false}                 │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [6] Pattern Analysis (RF-4)                                   │
│     - Para palavras inválidas                                │
│     - Analisa terminação (e.g., "-g", "-c")                 │
│     - Compara com padrões válidos/inválidos do idioma        │
│     - Aumenta confiança se padrão suspeito                   │
│     - Output: confidence: 0.95                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [7] Length Heuristic (RF-5)                                   │
│     - Valida comprimento da palavra                          │
│     - Ajusta confiança: 3-4 chars = +30%                     │
│     - Output: confidence: 0.90                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [8] Context Enrichment (RF-6)                                 │
│     - Analisa 2-3 palavras antes                             │
│     - Valida pontuação/preposições                           │
│     - Reduz falsos positivos                                 │
│     - Output: confidence: 0.88 ou descarta                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [9] Reporting (RF-7)                                          │
│     - Estrutura dados em JSON                                │
│     - Serializa com metadata da página                       │
│     - Output: JSON report                                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ [10] Delivery                                                 │
│     - Opção 1: POST para servidor cliente                    │
│     - Opção 2: Download JSON local                           │
│     - Opção 3: Exibir no popup da extensão                   │
│     - Opção 4: Highlight visual na página                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Configurações & Filtros

### Painel de Configuração (options.html)
```
☑ Habilitar detecção automática ao abrir página
☑ Analisar apenas elementos visíveis (acima da fold)
☑ Incluir elementos em <iframes>
☑ Ignorar certos seletores CSS: .ad, .modal, .hidden, .lazy-load

Filtros de Confiança:
  Reportar apenas confiança acima de: [Slider 0.5 --- 1.0] (default: 0.7)

Idiomas:
  ☑ Português (Brasil)
  ☑ Espanhol
  ☑ Inglês

Ações:
  ○ Apenas coletar dados
  ○ Enviar para servidor
  ○ Salvar em localStorage
  ○ Destacar na página (cor: amarelo, vermelho, etc)

API Endpoint (opcional):
  https://api.seu-servidor.com/report
  [ ] Incluir cookies/credenciais
```

---

## 7. Limitações & Trade-offs

### Limitações Conhecidas

| Limitação | Impacto | Solução Futura |
|-----------|---------|---|
| Spell-check local tem margem ~2-3% erro | Falsos positivos ocasionais | Integrar API LanguageTool para validação |
| Dicionários estáticos (não atualizam) | Palavras novas/gírias não reconhecidas | Deploy mensal de dicionários atualizados |
| Não detecta truncamento em atributos HTML | Perda de casos em `title=""`, `alt=""`, etc | Extensão de escopo (RFC futura) |
| Multi-idioma pode ser ambíguo | Erro em páginas bilíngues | Detecção por parágrafo ao invés de página |
| Não valida qual era a palavra original | Requer validação manual | Não é objetivo da v1 |
| Falsos positivos com regionalismos | ~5-10% false positive rate | Crowdsourcing de ajustes de dicionário |

### Trade-offs
```
✗ Velocidade vs Precisão
  → Escolhido: Velocidade (3s max)
  → Precisão: 90-95% (aceitável para triagem)

✗ Tamanho da Extensão vs Funcionalidade
  → Dicionários ocupam ~10MB
  → Tradeoff: Offline-first é crítico para esse caso

✗ Coverage vs Performance
  → Analisar TODOS elementos = lento
  → Filtragem visual previa = 70% redução sem perder casos reais
```

---

## 8. Métricas de Sucesso

### Métricas Técnicas
```
Precision: >= 90% (de elementos reportados, 90%+ realmente cortados)
Recall: >= 75% (de elementos cortados na página, 75%+ detectados)
Tempo execução: < 3 segundos
Taxa de falsos positivos: < 10%
Taxa de falsos negativos: < 25%
```

### Métricas de Negócio
```
Redução de tempo de análise manual: > 60%
Custo de implementação vs. ganho de produtividade: ROI > 2x
Taxa de adoção entre QA: > 70%
Satisfação do usuário: NPS > 7/10
```

---

## 9. Glossário & Definições

| Termo | Definição |
|-------|-----------|
| **Truncation** | Corte intencional/não intencional de texto no meio de uma palavra |
| **Confidence Score** | Probabilidade (0-1) de que a detecção é um verdadeiro positivo |
| **False Positive** | Elemento marcado como truncado mas na verdade está completo |
| **False Negative** | Elemento truncado que não foi detectado |
| **Spell-Check** | Validação de se uma palavra existe no dicionário do idioma |
| **Pattern Termination** | Sequência final de caracteres de uma palavra (e.g., "-tion", "-ment") |
| **Context Enrichment** | Análise de palavras vizinhas para validar se truncação faz sentido |

---

## 10. Roadmap Futuro

### V1 (MVP)
```
✓ Detecção visual rápida
✓ Spell-check local offline
✓ Análise de padrão de terminação
✓ Suporte PT/ES/EN
✓ Reportagem JSON
```

### V2 (Enhancements)
```
☐ Integração com LanguageTool API para validação extra
☐ Machine Learning para redutor falsos positivos
☐ Análise de atributos HTML (alt, title, placeholder)
☐ Multi-idioma por parágrafo
☐ Dashboard de histórico de análises
```

### V3 (Scale)
```
☐ Integração com ferramentas de CI/CD
☐ API para integração em sistemas de CMS
☐ Validação de sugestão de palavra completa
☐ Suporte de novos idiomas (chinês, árabe, etc)
```

---

## Apêndice A: Exemplos de Casos de Uso

### Caso 1: Português - Imagen Incompleta
```
Página: Blog em PT-BR
Elemento: <p class="description">
Conteúdo: "Sinta-se dentro da partida. Em tempo real, a Inteligência Artificial equilibra e amplifica as vozes da torcida e deixa as imag"

Execução:
[1] DOM Scanner: detect overflow:hidden ✓
[2] Language: pt-BR
[3] Extract: "imag"
[4] Spell-check: false (não existe)
[5] Pattern: termina em "-g" (RARO em pt) → +40% conf
[6] Length: 4 chars → +30% conf
[7] Context: "deixa as" + noun → SUSPEITO
[8] Final: confidence = 0.95 (HIGH)

Report: ✓ TRUNCATION DETECTED
```

### Caso 2: Espanhol - Verbo Incompleto
```
Página: Suporte em ES
Elemento: <span>
Conteúdo: "Disculpe, tenemos problemas para proce"

Execução:
[1] DOM Scanner: text-overflow:ellipsis ✓
[2] Language: es-ES
[3] Extract: "proce"
[4] Spell-check: false (no existe)
[5] Pattern: termina en "-e" (neutro en ES)
[6] Length: 5 chars → +20% conf
[7] Context: "para" (preposición) + verbo incompleto
[8] Final: confidence = 0.82 (MEDIUM)

Report: ⚠ PROBABLE TRUNCATION
```

### Caso 3: Inglês - Falso Positivo (Descartado)
```
Página: Homepage en EN-US
Elemento: <button>
Conteúdo: "Learn More"

Execução:
[1] DOM Scanner: no visual signals ✗
[2] Language: en-US
[3] Extract: "More"
[4] Spell-check: true (exists "more") ✓
[5] No continuation needed

Report: ✗ NO TRUNCATION
```

### Caso 4: Português - Abreviação Legítima
```
Página: Documento em PT-BR
Elemento: <p>
Conteúdo: "Para mais informações, contate o Dr."

Execução:
[1] DOM Scanner: no visual signals
[2] Language: pt-BR
[3] Extract: "Dr"
[4] Spell-check: false (é abreviação)
[5] Pattern: "-r" (comum em PT, não suspeito)
[6] Context: título/honorífico antes
[7] Final: confidence = 0.25 (LOW)

Report: ✗ DISCARDED (confiança < threshold 0.7)
```

---

## Apêndice B: Referências Externas

- Typo.js: https://github.com/cfinke/Typo.js
- OpenOffice Dictionaries: https://github.com/LibreOffice/dictionaries
- LanguageTool: https://languagetool.org/
- Mozilla Language Detection: https://github.com/mozilla/browser-f/
