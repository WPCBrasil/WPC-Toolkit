import { isValidCheilEmail, normalizeEmail } from '../lib/email.js';
import { scriptGet, scriptPost } from '../lib/report-script.js';

// ── Pessoas do time (authors do ticket) ───────────────────
// Cada pessoa tem nome + e-mail Cheil.
//   • O NOME escolhido no Report vai para a coluna M (Publisher)
//   • O E-MAIL dessa pessoa vai para a coluna O (Email Publisher)
//
// Para adicionar/remover pessoas FIXAS, edite as listas abaixo.
// A ordem alfabética é aplicada automaticamente.
//
// Publishers novos também podem ser cadastrados pelo próprio usuário
// no botão "Add new publisher" do seletor de author. Eles ficam salvos
// na aba "Publishers" da planilha (via Apps Script), aparecem para todo
// o time e têm um cache local em chrome.storage.local ("customAuthors").

export const BASE_AUTHOR_GROUPS = [
  {
    id: 'publisher', label: 'Publishers', tag: 'Publisher',
    people: [
      { name: 'José Campelo',       email: 'jose.jr@cheil.com' },
      { name: 'Lucas Vieira',       email: 'lucas.v@cheil.com' },
      { name: 'Felipe Laurindo',    email: 'castro.f@cheil.com' },
      { name: 'Jhonatas Verissimo', email: 'jhonatas.s@cheil.com' },
      { name: 'Mateus Pereira',     email: 'santos.m@cheil.com' },
      { name: 'Larissa Navarro',    email: 'l.navarro@cheil.com' },
      { name: 'Lucas Policarpo',    email: 'l.policarpo@cheil.com' },
      { name: 'Ghabriel Angello',   email: 'ghabriel.s@cheil.com' },
      { name: 'Daniel Hilaya',      email: 'd.huarachi@cheil.com' },
      { name: 'Enzo Xavier',        email: 'enzo.x@cheil.com' },
      { name: 'Giovanni Savassa',   email: 's.giovanni@cheil.com' },
      { name: 'David Duarte',       email: 'duarte.d@cheil.com' },
      { name: 'Gustavo Araujo',     email: 'a.gustavo@cheil.com' },
      { name: 'Maicon Almeida',     email: 'maicon.a@cheil.com' },
      { name: 'Melck Messias',      email: 'melck.m@cheil.com' },
      { name: 'Thais Silva',        email: 's.thais@cheil.com' },
      { name: 'Victor Almeida',     email: 'almeida.v@cheil.com' },
      { name: 'Gustavo Cardoso',    email: 'cardoso.g@cheil.com' },
      { name: 'Gustavo Moreira',    email: 'g.moreira@cheil.com' },
      { name: 'Akira Freitas',      email: 'akira.f@cheil.com' },
      { name: 'Kênia Ferreira',     email: 'kenia.f@cheil.com' },
    ],
  },
  {
    id: 'qa', label: 'QAers', tag: 'QA',
    people: [
      { name: 'Rafael Momberg',   email: 'r.andrade@cheil.com' },
      { name: 'Lucas Elias',      email: 'lucas.e@cheil.com' },
      { name: 'Gabriel Marques',  email: 'g.conceicao@cheil.com' },
      { name: 'Kaue Souza',       email: 'kaue.s@cheil.com' },
      { name: 'Lucas De Simone',  email: 'lucas.ds@cheil.com' },
      { name: 'Lincoln Araújo',   email: 'lincoln.s@cheil.com' },
      { name: 'Henrique Almeida', email: 'h.almeida@cheil.com' },
    ],
  },
  {
    id: 'pm', label: 'PM', tag: 'PM',
    people: [
      { name: 'Felipe Fernandes', email: 'felipe.sf@cheil.com' },
      { name: 'Julio Cesar',      email: 'julio.cs@cheil.com' },
      { name: 'Luciana Fontana',  email: 'luciana.f@cheil.com' },
      { name: 'Jorge Luiz',       email: 'jorge.santos@cheil.com' },
    ],
  },
].map(g => ({
  ...g,
  people: [...g.people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
}));

const CUSTOM_KEY = 'customAuthors';   // cache local da aba "Publishers" da planilha

export function normalizeName(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function sanitize(list) {
  return (Array.isArray(list) ? list : [])
    .filter(p => p && p.name && isValidCheilEmail(p.email))
    .map(p => ({ name: String(p.name).trim(), email: normalizeEmail(p.email) }));
}

async function saveCache(list) {
  const clean = sanitize(list);
  await chrome.storage.local.set({ [CUSTOM_KEY]: clean });
  return clean;
}

// Cache local (instantâneo, funciona offline)
export async function loadCustomAuthors() {
  const res = await chrome.storage.local.get([CUSTOM_KEY]);
  return sanitize(res[CUSTOM_KEY]);
}

// Busca a lista compartilhada na planilha e atualiza o cache
export async function syncCustomAuthors() {
  const body = await scriptGet('publishers');
  return saveCache(body.publishers);
}

// Lista final = lista fixa + cadastrados pelo usuário (na aba Publishers)
export function buildAuthorGroups(custom) {
  return BASE_AUTHOR_GROUPS.map(g => {
    if (g.id !== 'publisher') return g;
    const people = [
      ...g.people,
      ...custom.map(p => ({ ...p, custom: true })),
    ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return { ...g, people };
  });
}

// Procura nome ou e-mail já existente em qualquer grupo
export function findDuplicate(groups, { name, email }) {
  const n = normalizeName(name);
  const e = normalizeEmail(email);
  for (const g of groups) {
    for (const p of g.people) {
      if (normalizeName(p.name) === n) return { field: 'name', person: p, group: g };
      if (p.email && normalizeEmail(p.email) === e) return { field: 'email', person: p, group: g };
    }
  }
  return null;
}

// Grava na aba "Publishers" da planilha (visível para todo o time)
export async function addCustomAuthor({ name, email, addedBy, addedByEmail }) {
  const body = await scriptPost({
    action: 'addPublisher',
    name, email: normalizeEmail(email), addedBy, addedByEmail,
  });
  return saveCache(body.publishers);
}

export async function removeCustomAuthor(name) {
  const body = await scriptPost({ action: 'removePublisher', name });
  return saveCache(body.publishers);
}

// Busca o e-mail de uma pessoa pelo nome + grupo ('' se não encontrado)
export function emailOf(groups, name, groupId) {
  const group = groups.find(g => g.id === groupId);
  const person = group?.people.find(p => p.name === name);
  return person?.email || '';
}
