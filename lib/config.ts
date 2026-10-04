// Configurações da loja. Edite aqui para mudar contato, pedido mínimo, entregas e cupons.

export const loja = {
  nome: "Mar de Rosas Lingerie",
  slogan: "Moda íntima com elegância e qualidade. Catálogo exclusivo para revendedoras.",
  // Somente números, com DDI 55 + DDD
  whatsapp: "5562995249197",
  whatsappExibicao: "(62) 99524-9197",
  vendedora: "Mar de Rosas",
};

/** Valor mínimo do pedido em reais (0 = sem mínimo). */
export const pedidoMinimo = 300;

export type FormaEntrega = {
  id: string;
  titulo: string;
  descricao: string[];
  valor: number;
};

export const formasEntrega: FormaEntrega[] = [
  {
    id: "retirada",
    titulo: "Retirada na loja",
    descricao: ["Endereço da loja a definir", "Aguarde a confirmação da vendedora para retirar."],
    valor: 0,
  },
  {
    id: "excursao",
    titulo: "Excursão / Ônibus",
    descricao: [
      "Envie as informações da excursão para a vendedora: dia, data e horário.",
      "Caso a entrega não seja possível, uma nova taxa de motoboy será cobrada.",
    ],
    valor: 20,
  },
  {
    id: "correios",
    titulo: "A combinar pelos Correios",
    descricao: ["Após separar o pedido, fazemos a cotação real do frete."],
    valor: 0,
  },
];

export type Cupom = { codigo: string; percentual: number };

export const cupons: Cupom[] = [{ codigo: "BEMVINDA10", percentual: 10 }];

export function buscarCupom(codigo: string): Cupom | undefined {
  const c = codigo.trim().toUpperCase();
  return cupons.find((cupom) => cupom.codigo === c);
}
