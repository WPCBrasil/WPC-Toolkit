# Apps Script do Report

`Code.gs` é o código do Apps Script ligado à planilha do Report.

## O que ele faz
- **Report** (POST padrão): grava na primeira aba, colunas A–O.
  N = e-mail do QA, O = e-mail do publisher. Rejeita e-mails que não sejam @cheil.com.
- **Publishers compartilhados**: aba `Publishers` (criada sozinha no fim da planilha).
  - `GET ?action=publishers` → lista
  - `POST {action:'addPublisher', name, email, addedBy, addedByEmail}`
  - `POST {action:'removePublisher', name}`

## Como atualizar
1. Extensões → Apps Script (na planilha) → substituir todo o código por `Code.gs` → Salvar.
2. Implantar → Gerenciar implantações → lápis (Editar) → Versão: **Nova versão** → Implantar.
   Assim a URL /exec continua a mesma e a extensão não precisa ser alterada.
3. Conferir que "Quem pode acessar" continua igual ao que já era.
