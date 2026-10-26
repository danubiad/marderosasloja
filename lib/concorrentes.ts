// Concorrentes da loja, lidos do DonaSystem (VPS). Quem cuida da lista e da coleta diária é o
// DonaSystem (Conteúdo → Concorrentes Loja); aqui o painel só mostra. A chave fica na variável
// CONCORRENTES_CHAVE da Vercel (a mesma de /home/painel/.config/concorrentes-chave na VPS).

const ENDERECO = "https://painel.lojamarderosas.com.br/api/publico/concorrentes";

export type PostConcorrente = {
  link: string;
  imagem: string | null;
  legenda: string;
  curtidas: number | null;
  comentarios: number | null;
  quando: string;
  tipo: string;
};

export type Concorrente = {
  id: string;
  instagram: string;
  site: string | null;
  perfil: { name?: string; profile_picture_url?: string; followers_count?: number; media_count?: number } | null;
  ig_erro: string | null;
  ig_atualizado: string | null;
  medindo_desde: string | null;
  ganho: { dia: number | null; semana: number | null; mes: number | null };
  serie: { dia: string; seguidores: number | null }[];
  posts_por_dia: { semana: number; mes: number };
  posts_30d: number;
  tipos_30d: Record<string, number>;
  engajamento_medio: number | null;
  top: PostConcorrente[];
  site_info: null | {
    produtos: number | null;
    plataforma: string | null;
    erro: string | null;
    variacao: { semana: number | null; mes: number | null };
    novos_7d: number;
    novos_exemplos: string[];
    google: { mes: string; faixa: number | null }[];
  };
};

export type ResultadoConcorrentes =
  | { ok: true; concorrentes: Concorrente[] }
  | { ok: false; erro: string };

export async function lerConcorrentes(): Promise<ResultadoConcorrentes> {
  const chave = process.env.CONCORRENTES_CHAVE?.trim();
  if (!chave) return { ok: false, erro: "Falta a variável CONCORRENTES_CHAVE na Vercel." };
  try {
    const r = await fetch(ENDERECO, {
      headers: { authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 401) return { ok: false, erro: "A chave CONCORRENTES_CHAVE não confere com a do DonaSystem." };
    const d = await r.json();
    return d.ok ? { ok: true, concorrentes: d.concorrentes } : { ok: false, erro: d.erro || "O DonaSystem não respondeu." };
  } catch {
    return { ok: false, erro: "O DonaSystem não respondeu agora. Tente de novo em instantes." };
  }
}
