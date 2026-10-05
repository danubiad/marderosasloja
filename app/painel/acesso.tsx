import { estaLogado, painelConfigurado } from "@/lib/painel";
import { FormLogin } from "./FormLogin";

/** Tela de bloqueio do painel: devolve o que mostrar se não estiver logada, ou null se pode entrar. */
export async function bloqueioPainel() {
  if (!painelConfigurado()) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold">Painel de pedidos</h1>
        <p className="mt-4 text-suave">
          O painel ainda não tem senha. Na Vercel, crie a variável de ambiente <code>PAINEL_SENHA</code> e faça um novo
          deploy.
        </p>
      </main>
    );
  }
  if (!(await estaLogado())) return <FormLogin />;
  return null;
}

/** Link de WhatsApp para um número brasileiro só com dígitos (DDD + número). */
export function linkWhatsapp(telefone: string, texto: string) {
  return `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`;
}

export function tempoAtras(iso: string, agora = Date.now()) {
  const min = Math.round((agora - Date.parse(iso)) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

/** Momento da requisição (as páginas do painel são geradas a cada acesso). */
export function momentoAtual() {
  return Date.now();
}
