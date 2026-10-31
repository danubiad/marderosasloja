@AGENTS.md

# Mar de Rosas Lingerie — Catálogo Atacado

Catálogo de atacado para revendedoras (Next.js 16 + Tailwind 4, Upstash Redis na Vercel).
A dona da loja fala em português, com mensagens curtas — responda em português, simples e direto.

## Onde as coisas ficam

- **Código:** esta pasta (`C:\Users\marde\marderosas-catalogo`)
- **GitHub:** `danubiad/marderosasloja` — todo push na `main` publica sozinho na Vercel
- **Antes de mexer, `git pull`:** desde 24/10/2026 o agente atualizacao-de-catalogo, na VPS da Hostinger, também cadastra produtos e faz
  push aqui (7h e 19h), lendo a pasta `G:\Meu Drive\Catálogo` do Google Drive. Nunca trabalhar sem puxar antes
- **Site:** https://lojamarderosas.com.br (no ar desde 05/10/2026; DNS no registro.br com registros A → `76.76.21.21`).
  O endereço antigo `marderosasloja.vercel.app` continua funcionando.
- **Painel da loja:** `/painel` (senha na variável `PAINEL_SENHA`, em `.env.local` e na Vercel — nunca escrever a senha em arquivos do repositório)
- **Área da revendedora:** `/revendedora`; catálogo próprio de cada revendedora em `/r/<usuario>`
- **Fotos dos produtos novos (enviadas pela dona):** desde 24/10/2026 no Google Drive, `G:\Meu Drive\Catálogo`. A cópia antiga em
  `C:\Users\marde\OneDrive\Imagens\catalogo` não recebe mais produtos. As duas ficam por categoria: `<Categoria>\<Produto>`
  (Baby Doll, Camisolas, Conjuntos, Calcinhas, Pijamas, Kits, Masculino, Robes, Infantil)

## Regras do negócio (já decididas)

Tudo em `lib/config.ts`:

- Pedido mínimo: **R$ 350 ou 10 peças variadas** (vale o que atingir primeiro)
- Entrega: **Excursão/Ônibus (R$ 30)** ou **A combinar pelos Correios** (frete cotado depois). Retirada na loja foi removida.
- No catálogo da revendedora a entrega é "Combinar com a vendedora".
- Cupom: `BEMVINDA10` (10%)
- WhatsApp da loja: (62) 99524-9197 — o pedido é enviado para lá
- Perfil/bio no topo estilo Instagram (@marderosasloja, Itaguari-GO, atacado desde 2010), banners e faixa de aviso no topo
- Selos do cartão da loja (inspirado na Fiorenzo Moda Íntima, print em `OneDrive\Imagens\site\detalhes`): "✓ Atacado", "2.404 pedidos" e "1.170.493 visitas".
  Esses números são fixos, escolhidos pela dona (`perfil.pedidos` e `perfil.visitas` em `lib/config.ts`), e não são contados de verdade.
  Pedido mínimo e "desde 2010" saíram dos selos; o mínimo continua na faixa do topo, no rodapé e no carrinho
- Revendedoras: cada uma tem catálogo próprio com **margem %** sobre o atacado (máx. 300%, `lib/margem.ts`); o catálogo é aprovado automaticamente
- **Catálogo da revendedora sem a marca da loja (desde 20/10/2026):** em `/r/<usuario>` e nos pedidos dela, a logo e o nome "Mar de Rosas" não aparecem
  (topo, cartão, título da página, prévia do link no WhatsApp, texto de compartilhar). No lugar vai a foto ou logo que ela envia no painel
  ("Sua foto ou logo", `FormFoto.tsx`), guardada em JPG no Redis (`revendedora-foto:<usuario>`) e servida por `/api/revendedora-foto/<usuario>`.
  O endereço do site (lojamarderosas.com.br) continua aparecendo no link
- Conferência do pedido no painel com ✓/✕ e substituição de peças em falta em tempo real; a cliente também pode substituir e reenviar no WhatsApp
- Meta Pixel (`lib/pixel.ts`, ID 483350873657439): visita, produto visto, carrinho e pedido enviado (= `InitiateCheckout`, "iniciou a compra")
- **Compra (Purchase) só quando a dona confirma a venda no painel:** status "Confirmado" (ou Separando/Enviado/Concluído) envia a compra pela
  API de Conversões (`lib/meta-conversoes.ts`, token `META_CAPI_TOKEN` na Vercel), uma vez por pedido. O pedido guarda os cookies `_fbp`/`_fbc` no envio.
  Pedidos anteriores a 06/10/2026 não são enviados (já contaram como compra no Pixel)
- **Aba Dados do painel** (`/painel/dados`, desde 06/10/2026):
  - Eventos do catálogo da loja (sessão com UTM/origem, produto visto, carrinho, clique em "Enviar pedido no WhatsApp") contados por dia no Redis (`lib/eventos.ts`, `/api/eventos`). Catálogos das revendedoras não entram
  - Venda = status Confirmado/Separando/Enviado/Concluído, pelo dia do pedido, valor de atacado. Ticket médio, peças por venda, ranking top 10
  - A dona anota por dia: gasto com tráfego, seguidores do Instagram e mensagens do WhatsApp (`lib/diario.ts`); daí saem o ROAS e o crescimento do Instagram
  - Conexão com o Meta (`lib/meta-ads.ts`): a dona cola no painel o token de um usuário do sistema (ads_read, instagram_basic, pages_show_list, pages_read_engagement); fica no Redis (`config:meta-ads`), não na Vercel.
    Gasto diário da conta de anúncios soma com o gasto anotado ("outro tráfego, fora do Meta"); seguidores do Instagram são gravados no dia ao abrir a aba
  - Metas (`lib/metas.ts`): diária editável no painel (inicial R$ 5.000); semanal = ×7; mensal = × dias do mês; projeção do mês pelo ritmo atual
- Rodapé da loja (`components/Rodape.tsx`, dados em `loja` no `lib/config.ts`): CNPJ 12.529.165/0001-34, endereço Av. Goiás nº 73, Centro, Itaguari-GO, CEP 76650-000, pagamento Pix ou até 12x no cartão, postagem imediata (pronta entrega)
- **Sacolinha do Instagram (desde 19/10/2026):** `/api/catalogo-meta` é a lista de produtos (CSV) que o Gerenciador de Comércio da Meta lê todo dia; id = referência MR-0xx (igual ao Pixel). Produto com preço 0 fica de fora. As fotos vão em JPG por `/api/foto/produtos/<slug>/<n>.jpg` (converte o .webp; a Meta não aceita WebP). A loja do Instagram já existia ligada a outro site e foi trocada para este
- Botão de baixar foto (`components/BotaoBaixarFoto.tsx`) em cada foto do produto: salva em JPG para as revendedoras postarem no Instagram
- Página do produto (só no catálogo da loja): "Revenda por" = preço × 2, embaixo do preço. Carrinho da loja: barra de progresso até o pedido mínimo ("Falta R$ X para fechar seu pedido")
- Microsoft Clarity (`lib/clarity.ts`, ID ytqi537gsd): grava a navegação das clientes; pausado no `/painel`. Botão "Clarity" no topo do painel abre o dashboard
- Produto com `preco: 0` aparece como "Preço em breve" e não pode ser pedido
- **Aba Produtos do painel** (`/painel/produtos`, desde 20/10/2026): ativos primeiro, inativos embaixo, botão Ativar/Inativar; "Variações" desliga cor, tamanho inteiro
  ou combinação cor+tamanho (esgotado). Fica no Redis `produtos:disponibilidade` (`lib/disponibilidade.ts`, `lib/estoque.ts`) e vale na hora na loja, revendedoras,
  vídeos e sacolinha do Instagram (por isso essas páginas agora são geradas a cada acesso). O pedido com peça esgotada é recusado (`/api/pedidos`, erro 409)
  e a substituição não oferece o que está esgotado. Preço de custo: o das notas .txt fica em `data/custos.ts` (por id; cadastrar junto com produto novo),
  e o digitado no painel fica em `produtos:custos` e vale mais (null = apagado). Só o painel lê. A página do pedido no painel mostra
  custo total, venda (sem frete; em pedido de revendedora, o valor de atacado) e lucro, sem as peças em falta e com as substituições, usando o custo atual.
  **Preço de venda e promocional editáveis no painel (desde 20/10/2026):** campos "Venda R$" e "Promoção R$" na aba Produtos, guardados em
  `produtos:disponibilidade` (`preco`, `precoPromocional`) e aplicados por `aplicarPreco` (`lib/disponibilidade.ts`) na loja, revendedoras, carrinho
  (as páginas de carrinho/finalizar recebem a disponibilidade), pedido, substituição e sacolinha do Instagram. Com promoção, o de venda vira o riscado
  (`precoDe`) e o produto vai para Promoções. O preço do painel vale mais que o de `data/catalogo.ts`; se ficar igual ao cadastro, volta a seguir o arquivo.
  Produto com preço por tamanho (`precosTamanho`) não tem esses campos: muda pelo cadastro
- **Promoções:** a dona pode fazer sozinha no painel (campo "Promoção R$"). Pelo código, "colocar na promoção" = `preco` com o valor novo e `precoDe` com o antigo (ex.: `preco: 39.90, precoDe: 45.00`).
  O produto aparece no botão "Promoções" da vitrine, com o preço riscado e a etiqueta de desconto. Não existe categoria "Promoções".
  Em promoção (de R$ 45 por R$ 39,90, desde 06/10/2026): Baby Doll Kelly, Babadinho, Tifany e Short Curto

## Preço de custo (desde 20/10/2026)

- A dona escreve o custo na nota `.txt` da pasta do produto (ex.: "custo 30,00 / venda 40,00"). Para levar ao site: adicionar em `data/custos.ts`
  (id do produto → valor, com o nome em comentário), `npm run build`, commit e push. Produto novo com custo na nota: cadastrar o custo junto
- Nota com custo diferente no EXG (Luciana, Mayara, Karen): o site guarda um custo só por produto, então vai o de P a GG (o do EXG fica no comentário)
- Pastas repetidas com outro nome usam o custo do produto que já existe. Tifany/Maisa = R$ 32,00 (decidido pela dona; as notas diziam 30,00 e 32,90)
- 20/10/2026: só os baby dolls têm custo no arquivo (22 produtos, de 87). Baby Doll XG (id 63) está sem custo: a nota não tem
- **O que o Claude não consegue fazer daqui:** ler ou gravar o banco (Redis) de produção. A chave `KV_REST_API_TOKEN` é "Sensitive" na Vercel,
  então `vercel env pull` traz o valor vazio. Também não pode entrar no painel digitando a senha. Por isso não dá para ver o que a dona digitou à mão no painel
  (custos, disponibilidade). Para isso, a dona precisa abrir o Chrome com a extensão do Claude conectada e o `/painel` já logado

## Grades de tamanho (`data/tipos.ts`)

- Padrão: `P M G GG`
- Plus Size: `48 50 52 54` (Pijama Suede Plus Size é tamanho único XG, veste 48 ao 52)
- Infantil: `PP P M G GG XG`, com a idade embaixo de cada tamanho (`IDADES_INFANTIL`)
- Kits de 10 calcinhas (categorias Calcinhas + Kits, desde 07/10/2026): cores variadas, uma linha só "Cores Variadas"; a cliente escolhe a combinação
  de tamanhos (`TAMANHOS_KIT_CALCINHAS`: 2P 3M 3G 2GG, 3M 4G 3GG, 10 P/M/G/GG, Outro). Preços: cós alto e lateral larga R$ 150, cós baixo R$ 140, fio regulável (tamanho único) R$ 120.
  Cada kit conta como 1 peça no carrinho
- **Preço por tamanho:** `precosTamanho` no produto (ex.: Pijama Mãe e Filha, adulto R$ 40 e infantil R$ 38 na mesma grade, tamanhos "P inf." etc.).
  O preço aparece embaixo de cada tamanho e vale no carrinho, no pedido, na substituição e na margem da revendedora
- Categorias fixas, na ordem do filtro: Conjuntos, Calcinhas, Kits, Camisolas, Robes, Baby Doll, Baby Doll Infantil, Pijama, Cueca, Sutiã Avulso, Amamentação (desde 29/10/2026), Plus Size. Um produto pode estar em mais de uma.

## Como cadastrar produtos novos

A dona coloca **uma pasta por produto** em `C:\Users\marde\OneDrive\Imagens\catalogo`, com fotos, vídeos `.mp4` e um `.txt` com preço e tamanhos.
Para achar os novos, olhe a data de modificação das pastas e compare com o que já existe em `public/produtos/`.

1. **Fotos:** converter para `.webp` em `public/produtos/<slug>/` (usar `sharp`, já instalado), no máximo 1200 px de largura (veja abaixo)
2. **Bolinhas de cor:** recorte do tecido em `public/produtos/amostras/<slug>-<cor>.webp`
   (`npm run amostra -- <foto> <nome> <x%> <y%> [tamanho%]`); cada cor tem `nome`, `hex`, `foto` e `amostra`
3. **Cadastro:** adicionar em `data/catalogo.ts` com a próxima referência `MR-0xx` (última usada: MR-135, em 30/10/2026), próximo `id`, `novidade: true` e `criadoEm` com a data do dia
4. **Vídeos:** `.mp4` em `public/videos/<slug>/` e capa `.webp` ao lado; registrar em `data/videos.ts`.
   Para gerar a capa precisa de ffmpeg — instalar `ffmpeg-static` via npm na pasta temporária (scratchpad), não no projeto
5. **Custo:** se a nota tiver custo, adicionar em `data/custos.ts` com o `id` do produto
6. Conferir `npm run build`, fazer commit em português (ex.: "Novo produto: Calcinha Toda Dupla (R$ 18)") e push na `main`

**Capa diferente na Ita Bonita (pedido da dona, 24/10/2026):** quando o produto novo também for para a Ita Bonita (`C:Usersmardeitabonita-catalogo`), a capa (a 1ª de `fotos`) tem que ser **outra foto** lá, para os catálogos não ficarem iguais. Escolha outra foto boa do mesmo produto (de preferência outra cor ou outra pose) e coloque em 1º na Ita Bonita. Se o produto só tiver uma foto, use a foto de outra cor (`cores[].foto`); se não houver nenhuma outra, avise a dona.

**Fotos sem o otimizador da Vercel (desde 24/10/2026):** o `next.config.ts` tem `images: { unoptimized: true }`. A cota grátis de otimização de imagens da Vercel (é da conta, vale para os dois sites) acabou e as fotos davam erro 402 no celular. **Nunca tire essa linha.** Como a foto vai do jeito que está, ela tem que ficar leve: `.webp`, no máximo 1200 px de largura (`sharp(...).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 })`), de preferência até ~200 KB. Se as fotos quebrarem de novo, teste uma com `curl -I` e veja o código.

**Atenção:** confira se não há fotos trocadas ou repetidas entre pastas — já aconteceu com a "Calcinha toda dupla".
Antes de cadastrar, compare as fotos com os produtos que já existem: a dona às vezes manda de novo um modelo que já está no site, com outro nome
(ex.: "Baby Doll Maisa" = Baby Doll Tifany, "Baby Doll Curtinho" = Baby Doll Short Curto, "Conjunto Clássico" = Conjunto Básico, "Cueca sem costura Leco" = Cueca Sem Costura, mantida em R$ 29,90, "Baby Doll Borboleta" = Baby Doll Diamante Borboleta, "pijama americano botão" = Pijama Americano Alça, "Baby Doll Thainara" = Baby Doll Luciana; nesses casos as cores novas entram no produto que já existe). Na dúvida, pergunte antes de criar produto repetido.
A pasta pode vir sem `.txt`; nesse caso o preço e os tamanhos vêm da mensagem dela.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem Redis configurado, os pedidos de teste ficam em `.data/pedidos.json`.

## Aba Concorrentes do painel (desde 26/10/2026)

`/painel/concorrentes` só mostra os concorrentes que o DonaSystem (VPS) acompanha: `lib/concorrentes.ts` busca em
`https://painel.lojamarderosas.com.br/api/publico/concorrentes` com a chave `CONCORRENTES_CHAVE` (variável da Vercel; a mesma de
`/home/painel/.config/concorrentes-chave` na VPS). Adicionar ou tirar concorrente: no DonaSystem, Conteúdo → Concorrentes Loja.

## Segurança (30/10/2026)

- Next.js 16.4.3 (a 16.3.8 tinha falhas públicas). Rodar `npm audit --omit=dev` de vez em quando.
- Revendedoras: senha mínima de 8; o cookie leva a versão da sessão (`sessao` no cadastro), e "Sair" ou senha nova desconectam todos os aparelhos.
  "Esqueci minha senha" grava `pedidoSenha`; no painel (Revendedoras) a dona toca em "Mandar link de senha nova", que abre o WhatsApp dela com o link
  `/revendedora/nova-senha?t=<código>` (vale 1 hora, uso único; no banco fica só o hash do código, `revendedora-senha:<sha256>`).
- Painel da loja (desde 30/10): conta no banco (`painel:conta`, `lib/painel.ts`): senha (hash, mín. 10), Google Authenticator (`lib/totp.ts`),
  e-mail de recuperação e versão da sessão. PAINEL_SENHA só vale até o 1º login (aí é copiada para o banco). Aba Segurança: ligar o Authenticator
  (QR), trocar senha, sair dos outros aparelhos, e-mail + teste. "Esqueci minha senha" manda link por e-mail pelo Resend (`lib/email.ts`,
  RESEND_API_KEY na Vercel; sem domínio próprio o Resend só entrega no e-mail da conta dele), link de 30 min, uso único, pede o código.
  Emergência (perdeu o celular): PAINEL_SEM_AUTHENTICATOR=1 na Vercel desliga o código.
- Falta: firewall da Vercel e aviso de consumo do Upstash.
