import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { loja } from "@/lib/config";

export const metadata: Metadata = {
  title: `Política de Privacidade — ${loja.nome}`,
  description: `Como a ${loja.nome} coleta, usa e protege os seus dados.`,
};

const atualizada = "31 de outubro de 2026";

export default function Privacidade() {
  const whatsapp = `https://wa.me/${loja.whatsapp}`;
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-sm leading-relaxed">
        <h1 className="font-serif text-3xl font-semibold">Política de Privacidade</h1>
        <p className="mt-1 text-suave">Atualizada em {atualizada}</p>

        <div className="mt-6 space-y-6 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <section className="space-y-2">
            <p>
              Esta política explica como a {loja.nome} (CNPJ {loja.cnpj}, {loja.endereco}) trata os
              dados de quem usa o site {loja.dominio}, nossos perfis nas redes sociais e nossos
              aplicativos ligados ao Facebook e ao Instagram. Seguimos a Lei Geral de Proteção de
              Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section className="space-y-2">
            <h2>1. Quais dados coletamos</h2>
            <ul>
              <li>
                <strong>Dados do pedido:</strong> nome, telefone (WhatsApp), endereço de entrega e
                os produtos escolhidos.
              </li>
              <li>
                <strong>Dados da revendedora:</strong> nome, usuário, WhatsApp, foto ou logo enviada e
                a margem definida no catálogo.
              </li>
              <li>
                <strong>Dados de navegação:</strong> páginas e produtos vistos, itens no carrinho,
                endereço IP, tipo de navegador e cookies.
              </li>
              <li>
                <strong>Redes sociais:</strong> quando você interage com nossas páginas no Facebook e
                no Instagram, recebemos dados públicos do perfil e as mensagens ou comentários que
                você envia.
              </li>
            </ul>
            <p>Não coletamos senhas de cartão nem dados bancários pelo site.</p>
          </section>

          <section className="space-y-2">
            <h2>2. Para que usamos</h2>
            <ul>
              <li>Receber, conferir, separar e entregar os pedidos.</li>
              <li>Falar com você pelo WhatsApp sobre o seu pedido.</li>
              <li>Manter o catálogo das revendedoras funcionando.</li>
              <li>Entender como o site é usado e melhorar a loja.</li>
              <li>Medir e mostrar anúncios no Facebook e no Instagram.</li>
              <li>Cumprir obrigações legais e fiscais.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2>3. Cookies e ferramentas de terceiros</h2>
            <p>O site usa estas ferramentas, que podem gravar cookies no seu navegador:</p>
            <ul>
              <li>
                <strong>Meta Pixel e API de Conversões (Meta Platforms):</strong> medem visitas,
                produtos vistos, carrinho e compras, para os anúncios no Facebook e no Instagram.
              </li>
              <li>
                <strong>Microsoft Clarity:</strong> grava de forma anônima como as páginas são usadas
                (cliques e rolagem), para melhorarmos o site.
              </li>
            </ul>
            <p>
              Você pode apagar ou bloquear cookies nas configurações do seu navegador. Algumas partes
              do site, como o carrinho, podem deixar de funcionar.
            </p>
          </section>

          <section className="space-y-2">
            <h2>4. Com quem compartilhamos</h2>
            <p>Não vendemos seus dados. Eles só são compartilhados com:</p>
            <ul>
              <li>Empresas de hospedagem e banco de dados que mantêm o site no ar (Vercel e Upstash).</li>
              <li>Meta (Facebook, Instagram e WhatsApp), pelas ferramentas citadas acima.</li>
              <li>Transportadoras e Correios, para a entrega.</li>
              <li>Autoridades, quando a lei exigir.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2>5. Por quanto tempo guardamos</h2>
            <p>
              Guardamos os dados enquanto forem necessários para o pedido, para o catálogo da
              revendedora ou pelo prazo que a lei exigir. Depois disso, eles são apagados.
            </p>
          </section>

          <section className="space-y-2">
            <h2>6. Seus direitos</h2>
            <p>
              Você pode pedir a qualquer momento: confirmar se temos dados seus, ver uma cópia,
              corrigir, apagar, ou retirar o consentimento.
            </p>
          </section>

          <section id="exclusao-de-dados" className="scroll-mt-20 space-y-2">
            <h2>7. Como pedir a exclusão dos seus dados</h2>
            <p>
              Para apagar seus dados, incluindo os recebidos pelo Facebook ou pelo Instagram:
            </p>
            <ul>
              <li>
                Mande uma mensagem no WhatsApp{" "}
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                  {loja.whatsappExibicao}
                </a>{" "}
                com o texto “Quero apagar meus dados” e o nome e telefone usados no pedido.
              </li>
              <li>Respondemos e apagamos em até 15 dias, exceto o que a lei nos obriga a guardar.</li>
            </ul>
            <p>
              Para tirar o acesso de um aplicativo à sua conta do Facebook, abra Configurações →
              Aplicativos e sites, escolha o aplicativo e toque em Remover.
            </p>
          </section>

          <section className="space-y-2">
            <h2>8. Contato</h2>
            <p>
              Dúvidas sobre esta política: WhatsApp{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                {loja.whatsappExibicao}
              </a>
              , ou no endereço {loja.endereco}.
            </p>
            <p>Esta política pode mudar. A data no topo mostra a última atualização.</p>
          </section>
        </div>
      </main>
      <Rodape />
    </>
  );
}
