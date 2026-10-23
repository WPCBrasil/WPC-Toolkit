# PRD - Link Checker Extension
## Extensão Web para Detecção de Links Quebrados

**Versão:** 1.0  
**Data:** Junho 2026  
**Status:** Em Planejamento  

---

## 1. Visão Geral do Produto

### 1.1 Problema
Desenvolvedores, QA e proprietários de sites frequentemente precisam identificar links quebrados em suas páginas web. Atualmente, esse processo é manual e tedioso, envolvendo:
- Clicar manualmente em links
- Verificar status HTTP individualmente
- Testar compatibilidade regional de conteúdo
- Aguardar longos tempos de carregamento

### 1.2 Solução
Uma extensão web que automatiza a verificação de links quebrados através de análise inteligente de páginas, detectando:
- **Links 404**: Páginas não encontradas
- **Páginas em branco**: Conteúdo não carregado
- **Redirecionamentos geográficos**: Links apontando para país diferente da URL original
- **Problemas de carregamento**: Timeouts e erros de conexão

### 1.3 Valor Proposto
- ⚡ Análise rápida de múltiplos links em uma página
- 📊 Relatório detalhado de problemas encontrados
- 🌍 Detecção de incongruências geográficas
- 🔍 Verificação sem necessidade de ferramentas externas

---

## 2. Escopo do MVP

### 2.1 Funcionalidades Principais

#### 2.1.1 Análise de Links
- Escanear página atual e identificar todos os links
- Fazer requisições HTTP para cada link
- Classificar resultado de cada link (200, 404, redirecionamento, timeout, etc)
- Exibir status em tempo real durante o scan

#### 2.1.2 Detecção de Problemas

**Status 404 Not Found**
- Detectar links que retornam erro 404
- Registrar URL origem e URL de destino

**Páginas em Branco**
- Identificar páginas que carregam mas retornam conteúdo vazio
- Diferenciar de páginas com redirecionamento legítimo

**Incongruência Geográfica**
- Comparar país da URL original com país do IP do link destino
- Usar GeoIP para identificar localização do servidor
- Marcar redirecionamentos geográficos suspeitos

**Problemas de Carregamento**
- Detectar timeouts (5s limite)
- Registrar erros de conexão
- Diferenciar de respostas legítimas 3xx

#### 2.1.3 Interface da Extensão

**Popup Principal**
- Botão "Escanear Página" (iniciar análise)
- Indicador de progresso (X de Y links processados)
- Resumo: Total de links, Links OK, Links quebrados, Avisos

**Painel de Resultados**
- Lista de problemas encontrados (filtráveis)
- Para cada problema: URL destino, tipo de erro, timestamp
- Opção de "Copiar relatório"

**Opções/Settings**
- Timeout customizável (padrão 5s)
- Filtros por tipo de erro
- Opção de incluir links externos
- Opção de ignorar certos domínios

### 2.2 Requisitos Técnicos

#### Stack Frontend
- **Framework**: Vanilla JavaScript ou Preact (para performance)
- **UI**: HTML/CSS com design limpo e responsivo
- **Storage**: Chrome Storage API (salvar resultados)

#### Stack Backend / Service Worker
- **Service Worker**: Para processamento de requisições
- **APIs Utilizadas**:
  - Fetch API (para requisições HTTP)
  - Chrome Extension API (storage, tabs)
  - GeoIP API (detecção geográfica) - ex: ip-api.com, MaxMind

#### Arquitetura
```
chrome-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── background/
│   └── background.js
├── styles/
│   └── main.css
└── images/
    └── icon.png
```

### 2.3 Dependências
- **Playwright**: Para verificação de carregamento de páginas (integração com MCP)
- **GeoIP API**: Para detecção geográfica
- **Chrome Extensions API**: Runtime, storage, tabs

---

## 3. Passo a Passo de Desenvolvimento

### 🚀 FASE 0: Setup Inicial do Projeto

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

#### Passo 1: Modo Planejamento
```bash
# Abrir projeto em modo planejamento
# Atalho: Shift + Tab (em Claude.ai)
```
Descrição: Isso ativa o modo de planejamento estruturado, permitindo melhor organização.

#### Passo 2: Criar Pasta de Configuração
```bash
mkdir -p .claude
```
Descrição: Esta pasta armazenará arquivos de contexto e configuração do projeto.

#### Passo 3: Instalar CONTEXT-MODE Plugin
```bash
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
/context-mode:ctx-doctor
```
Descrição: CONTEXT-MODE permite melhor gerenciamento de contexto do projeto em Claude, facilitando a manutenção de estado durante desenvolvimento.

#### Passo 4: Instalar MCP Playwright
```bash
claude mcp add playwright npx @playwright/mcp@latest
```
Descrição: Playwright MCP permite que Claude automatize testes de navegação e verificação de carregamento de páginas, essencial para validar se links estão carregando corretamente.

#### Passo 5: Instalar MCP Context7
```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```
Descrição: Context7 fornece capacidades avançadas de gerenciamento de contexto para projetos complexos.

#### Passo 6: Verificar Instalações
```bash
/context-mode:ctx-doctor
```
Descrição: Comando de diagnóstico que verifica se todos os plugins e MCPs foram instalados corretamente.

#### Passo 7: Instalar Skills Relevantes
Acesse [skillsmp.com](https://skillsmp.com) e instale as seguintes skills:

| Skill | Quando Usar | Fase |
|-------|-----------|------|
| **brainstorming** | Gerar ideias de funcionalidades, UX e casos de uso | Fase 1 (Planejamento) |
| **chrome-extension-developer** | Setup, manifest.json, APIs de extensão Chrome | Fase 2 (Arquitetura) |
| **frontend-architecture** | Design da estrutura de componentes e estado | Fase 2 (Arquitetura) |
| **product-manager** | Priorização de features, roadmap, decisões de escopo | Fase 3 (Desenvolvimento) |
| **agent-browser** | Testes e validação da extensão em tempo real | Fase 4 (QA/Testing) |

**Como usar Skills no Claude:**
```bash
# Para ativar uma skill em uma mensagem:
@skill-name: [sua pergunta aqui]

# Exemplo:
@chrome-extension-developer: Como estruturar o manifest.json para uma extensão que acessa conteúdo de páginas?
```

#### Passo 8: Criar PRD.md
Este arquivo (PRD.md) serve como documento de requisitos do produto. Ele define:
- Visão geral da ferramenta
- Funcionalidades principais
- Requisitos técnicos
- Escopo do MVP

✅ **Status**: Você já está lendo este arquivo!

#### Passo 9: Executar /init
```bash
# Após criar PRD.md, execute:
/init
```
Descrição: Este comando lê o PRD.md e o projeto, gerando automaticamente o arquivo `CLAUDE.md` que contém o contexto consolidado do projeto. Este arquivo será usado como referência durante todo desenvolvimento.

#### Passo 10: Planejar com Base no Contexto
```bash
# Solicite ao Claude:
"Com base no CLAUDE.md e PRD.md, monte um planejamento detalhado para desenvolver esta extensão, incluindo:
1. Arquitetura técnica
2. Fases de desenvolvimento
3. Tarefas por fase
4. Critérios de aceitação
5. Dependências e riscos"
```

#### Passo 11: Salvar Planejamento
```bash
# Salve o resultado em:
.claude/plan.md
```
Descrição: Este arquivo será a fonte da verdade para acompanhamento durante todo desenvolvimento. Atualize-o conforme o projeto avança.

---

## 4. Fases de Desenvolvimento

### Fase 1: Planejamento e Arquitetura (1-2 dias)
- ✅ Definir arquitetura técnica completa
- ✅ Criar wireframes da interface
- ✅ Definir fluxo de dados
- ✅ Identificar riscos técnicos

**Skills Recomendadas**: `@brainstorming`, `@chrome-extension-developer`, `@frontend-architecture`

### Fase 2: Setup e Scaffolding (1 dia)
- Criar estrutura de pastas do projeto
- Implementar manifest.json v3
- Configurar ferramentas de build (webpack/vite)
- Setup de testes automatizados

**Skills Recomendadas**: `@chrome-extension-developer`

### Fase 3: Desenvolvimento MVP (3-5 dias)
- Implementar Content Script (extração de links)
- Implementar Background Worker (verificação de links)
- Implementar UI do popup
- Integração com APIs de GeoIP

**Skills Recomendadas**: `@product-manager` (priorização)

### Fase 4: Testes e Validação (1-2 dias)
- Testes unitários
- Testes de integração
- Testes em navegador real
- Validação com casos de teste

**Skills Recomendadas**: `@agent-browser` (testes automatizados)

### Fase 5: Polimento e Release (1 dia)
- Performance optimization
- Documentação
- Criação de demo
- Preparação para Chrome Web Store

---

## 5. Critérios de Sucesso

### MVP Viável
- [ ] Extensão instalável no Chrome
- [ ] Consegue extrair todos os links de uma página
- [ ] Detecta links com erro 404
- [ ] Detecta páginas em branco
- [ ] Detecta incongruências geográficas
- [ ] Interface funcional com resultados claros
- [ ] Relatório exportável

### Qualidade
- [ ] 0 erros de crash
- [ ] Performance: análise completa < 30 segundos
- [ ] 95%+ de acurácia na detecção
- [ ] Código testado e documentado

---

## 6. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| CORS bloqueando requisições | Alto | Usar proxy ou background worker |
| Rate limiting de APIs | Médio | Implementar fila e throttling |
| Timeouts variáveis | Médio | Configuração customizável de timeout |
| Complexidade GeoIP | Médio | Usar API terceirizada confiável |

---

## 7. Próximos Passos

1. ✅ **AGORA**: Você tem o PRD.md
2. ⏭️ **PRÓXIMO**: Execute `Passo 9` (/init) para gerar CLAUDE.md
3. ⏭️ **DEPOIS**: Execute `Passo 10` para criar o planejamento detalhado
4. ⏭️ **ENTÃO**: Inicie o desenvolvimento seguindo o plan.md

---

## Apêndice: Recursos e Referências

### Chrome Extensions
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Reference](https://developer.chrome.com/docs/extensions/mv3/)

### GeoIP APIs (Avaliar)
- ip-api.com (free tier: 45 req/min)
- MaxMind GeoIP2 (pago, mais preciso)
- GeoJS (free, comunitário)

### Ferramentas Recomendadas
- **Bundler**: Vite ou Webpack para Chrome Extensions
- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier
- **Version Control**: Git + GitHub

### Documentação Interna
- CLAUDE.md (gerado após /init)
- .claude/plan.md (planejamento detalhado)
- .claude/decisions.md (decisões arquiteturais)
- .claude/risks.md (acompanhamento de riscos)

---

**Última atualização**: Junho 2026  
**Mantido por**: Equipe de Desenvolvimento
