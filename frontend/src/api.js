// Cliente HTTP mínimo com JWT e refresh automático.
const chaves = { access: "cv_access", refresh: "cv_refresh" };

export const auth = {
  logado: () => !!localStorage.getItem(chaves.access),
  sair() {
    localStorage.removeItem(chaves.access);
    localStorage.removeItem(chaves.refresh);
  },
  async entrar(username, password) {
    const r = await fetch("/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error("Usuário ou senha inválidos.");
    const dados = await r.json();
    localStorage.setItem(chaves.access, dados.access);
    localStorage.setItem(chaves.refresh, dados.refresh);
  },
};

async function tentarRefresh() {
  const refresh = localStorage.getItem(chaves.refresh);
  if (!refresh) return false;
  const r = await fetch("/api/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) return false;
  localStorage.setItem(chaves.access, (await r.json()).access);
  return true;
}

export async function api(caminho, opcoes = {}, jaTentouRefresh = false) {
  const token = localStorage.getItem(chaves.access);
  const r = await fetch("/api" + caminho, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  if (r.status === 401 && !jaTentouRefresh && (await tentarRefresh())) {
    return api(caminho, opcoes, true);
  }
  if (!r.ok) {
    const corpo = await r.json().catch(() => ({}));
    throw new Error(corpo.detail || corpo.erro || `Erro ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}

export const dinheiro = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const TOTAL_MESAS = 12;
