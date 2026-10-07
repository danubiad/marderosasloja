import "server-only";
import { kv } from "@/lib/kv";

// Conexão do painel com o Meta (aba Dados): gasto diário da conta de anúncios e seguidores do Instagram.
// O token é colado pela dona no painel e fica guardado no Redis; a conta de anúncios e o Instagram
// são descobertos a partir dele.

const GRAPH = "https://graph.facebook.com/v23.0";
const CHAVE = "config:meta-ads";

export type ConexaoMeta = {
  token: string;
  contaAnuncio?: { id: string; nome: string };
  instagram?: { id: string; usuario: string };
};

type RespostaGraph<T> = T & { error?: { message: string } };

async function graph<T>(caminho: string, token: string, params: Record<string, string> = {}, cacheSegundos = 0) {
  const url = new URL(`${GRAPH}/${caminho}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const resposta = await fetch(url, cacheSegundos ? { next: { revalidate: cacheSegundos } } : { cache: "no-store" });
  const json = (await resposta.json()) as RespostaGraph<T>;
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function buscarConexaoMeta() {
  return kv.get<ConexaoMeta>(CHAVE);
}

export async function desconectarMeta() {
  await kv.del(CHAVE);
}

/** Testa o token, acha a conta de anúncios e o Instagram, e guarda. Devolve um aviso para a dona. */
export async function conectarMeta(token: string): Promise<string> {
  const conexao: ConexaoMeta = { token };
  try {
    const contas = await graph<{ data: { id: string; name: string; account_status: number }[] }>("me/adaccounts", token, {
      fields: "name,account_status",
    });
    const conta = contas.data.find((c) => c.account_status === 1) ?? contas.data[0];
    if (conta) conexao.contaAnuncio = { id: conta.id, nome: conta.name };
  } catch {}
  try {
    const paginas = await graph<{ data: { instagram_business_account?: { id: string; username: string } }[] }>("me/accounts", token, {
      fields: "instagram_business_account{id,username}",
    });
    const ig = paginas.data.find((p) => p.instagram_business_account)?.instagram_business_account;
    if (ig) conexao.instagram = { id: ig.id, usuario: ig.username };
  } catch {}

  if (!conexao.contaAnuncio && !conexao.instagram)
    return "Esse token não deu acesso à conta de anúncios nem ao Instagram. Confira as permissões e os ativos do usuário do sistema.";
  await kv.set(CHAVE, conexao);
  const faltou = !conexao.contaAnuncio ? "a conta de anúncios" : !conexao.instagram ? "o Instagram" : "";
  return faltou ? `Conectado, mas não encontrei ${faltou}. Confira se ele foi atribuído ao usuário do sistema.` : "";
}

/** Gasto em anúncios por dia (AAAA-MM-DD → R$). Atualiza a cada 10 minutos. */
export async function gastosMeta(conexao: ConexaoMeta, desde: string, ate: string): Promise<Record<string, number> | null> {
  if (!conexao.contaAnuncio) return null;
  try {
    const r = await graph<{ data: { date_start: string; spend: string }[] }>(
      `${conexao.contaAnuncio.id}/insights`,
      conexao.token,
      { fields: "spend", level: "account", time_increment: "1", time_range: JSON.stringify({ since: desde, until: ate }), limit: "100" },
      600,
    );
    return Object.fromEntries(r.data.map((d) => [d.date_start, Number(d.spend) || 0]));
  } catch (err) {
    console.error("Falha ao buscar gasto no Meta", err);
    return null;
  }
}

/** Seguidores do Instagram agora. Atualiza a cada 10 minutos. */
export async function seguidoresInstagram(conexao: ConexaoMeta): Promise<number | null> {
  if (!conexao.instagram) return null;
  try {
    const r = await graph<{ followers_count: number }>(conexao.instagram.id, conexao.token, { fields: "followers_count" }, 600);
    return r.followers_count;
  } catch (err) {
    console.error("Falha ao buscar seguidores no Instagram", err);
    return null;
  }
}
