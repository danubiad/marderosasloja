// Configurações da loja. Edite aqui para mudar contato, pedido mínimo, entregas e cupons.

export const loja = {
  nome: "Mar de Rosas Lingerie",
  slogan: "Moda íntima com elegância e qualidade. Catálogo exclusivo para revendedoras.",
  // Somente números, com DDI 55 + DDD
  whatsapp: "5562985315031",
  whatsappExibicao: "(62) 98531-5031",
  vendedora: "Mar de Rosas",
  /** Endereço do site, usado nos links que as revendedoras divulgam */
  dominio: "lojamarderosas.com.br",
  // Rodapé do catálogo da loja
  cnpj: "12.529.165/0001-34",
  endereco: "Avenida Goiás, nº 73, Centro — Itaguari-GO, CEP 76650-000",
  pagamento: "Pix ou parcelamento em até 12x no cartão",
  postagem: "imediato, pois todos os produtos são pronta entrega",
};

/** Valor mínimo do pedido em reais (0 = sem mínimo). */
export const pedidoMinimo = 350;

/** Alternativa ao valor mínimo: quantidade mínima de peças (0 = não vale). */
export const pecasMinimas = 10;

/** O pedido pode ser fechado se atingir o valor mínimo OU a quantidade mínima de peças. */
export function atingiuMinimo(subtotal: number, pecas: number) {
  return subtotal >= pedidoMinimo || (pecasMinimas > 0 && pecas >= pecasMinimas);
}

export const textoPedidoMinimo = `Pedido mínimo R$ ${pedidoMinimo.toFixed(2).replace(".", ",")}${
  pecasMinimas > 0 ? ` ou ${pecasMinimas} peças variadas` : ""
}`;

/** Perfil da loja mostrado no topo do catálogo, no estilo de uma bio do Instagram. */
export const perfil = {
  usuario: "marderosasloja",
  nome: "Mar de Rosas Lingerie | Moda Íntima",
  foto: "/logo/perfil.webp",
  categoria: "Loja de roupas femininas",
  bio: ["Somos de Itaguari Goiás", "Lingerie no atacado desde 2010", "Enviamos pra todo Brasil e exterior"],
  instagram: "https://www.instagram.com/marderosasloja/",
  seguidores: "54,2 mil",
  desde: "2010",
  /** Números mostrados nos selos do cartão da loja */
  pedidos: 2404,
  visitas: 1170493,
};

/** Banners do topo em vídeo (desde 13/11/2026): vídeo + capa + produto para onde o banner leva. */
export const banners = [
  { video: "/banners/conjunto-decote-profundo-preto.mp4", capa: "/banners/conjunto-decote-profundo-preto.webp", produto: "conjunto-decote-profundo", alt: "Conjunto Decote Profundo preto" },
  { video: "/banners/kit-3-pecas-fim-de-ano-amarelo.mp4", capa: "/banners/kit-3-pecas-fim-de-ano-amarelo.webp", produto: "kit-3-pecas-fim-de-ano", alt: "Kit 3 Peças Fim de Ano amarelo" },
  { video: "/banners/conjunto-correntes-chocolate.mp4", capa: "/banners/conjunto-correntes-chocolate.webp", produto: "conjunto-correntes", alt: "Conjunto Correntes chocolate" },
  { video: "/banners/conjunto-melinda-roxo.mp4", capa: "/banners/conjunto-melinda-roxo.webp", produto: "conjunto-melinda", alt: "Conjunto Melinda roxo" },
];

/** Grupo de clientes no WhatsApp: convite embaixo dos banners (só no catálogo da loja). */
export const grupoClientes = "https://chat.whatsapp.com/HjhpqOjSEZR8GWoYonFSea";

export type FormaEntrega = {
  id: string;
  titulo: string;
  descricao: string[];
  valor: number;
};

export const formasEntrega: FormaEntrega[] = [
  {
    id: "excursao",
    titulo: "Excursão / Ônibus",
    descricao: [
      "Envie as informações da excursão para a vendedora: dia, data e horário.",
      "Caso a entrega não seja possível, uma nova taxa de motoboy será cobrada.",
    ],
    valor: 30,
  },
  {
    id: "correios",
    titulo: "A combinar pelos Correios ou Transportadora",
    descricao: ["Após separar o pedido, fazemos a cotação real do frete."],
    valor: 0,
  },
];

/** No catálogo da revendedora, a entrega é combinada direto com ela. */
export const formasEntregaRevendedora: FormaEntrega[] = [
  {
    id: "combinar",
    titulo: "Combinar entrega com a vendedora",
    descricao: ["A vendedora entra em contato para combinar a entrega e o pagamento."],
    valor: 0,
  },
];

export type Cupom ={ codigo: string; percentual: number };

export const cupons: Cupom[] = [{ codigo: "BEMVINDA10", percentual: 10 }];

export function buscarCupom(codigo: string): Cupom | undefined {
  const c = codigo.trim().toUpperCase();
  return cupons.find((cupom) => cupom.codigo === c);
}
