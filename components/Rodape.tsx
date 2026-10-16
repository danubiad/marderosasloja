import { IconeWhatsapp } from "@/components/icones";
import { loja, pedidoMinimo, textoPedidoMinimo } from "@/lib/config";

export function Rodape() {
  return (
    <footer className="mt-auto border-t border-linha bg-creme px-4 py-10 text-center text-sm text-suave">
      <p className="mx-auto max-w-md">{loja.slogan}</p>
      {pedidoMinimo > 0 && (
        <p className="mt-2 font-medium text-dourado-escuro">{textoPedidoMinimo}</p>
      )}
      <a
        href={`https://wa.me/${loja.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 font-medium text-texto"
      >
        <IconeWhatsapp className="size-5 text-sucesso" /> {loja.whatsappExibicao}
      </a>
      <div className="mx-auto mt-6 max-w-md space-y-1">
        <p>
          <span className="font-medium text-texto">Formas de pagamento:</span> {loja.pagamento}
        </p>
        <p>
          <span className="font-medium text-texto">Prazo de postagem:</span> {loja.postagem}
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-md space-y-1 text-xs">
        <p>{loja.endereco}</p>
        <p>CNPJ {loja.cnpj}</p>
        <p className="pt-2">
          © {new Date().getFullYear()} {loja.nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
