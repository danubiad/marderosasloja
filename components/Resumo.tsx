import { formatarPreco } from "@/lib/format";

type Props = {
  pecas: number;
  subtotal: number;
  desconto: number;
  cupom?: string;
  entrega?: { titulo: string; valor: number };
  total: number;
};

export function Resumo({ pecas, subtotal, desconto, cupom, entrega, total }: Props) {
  return (
    <dl className="divide-y divide-white bg-fundo px-5 text-texto">
      <div className="flex justify-between gap-4 py-3">
        <dt>Solicitado</dt>
        <dd className="flex gap-6">
          <span>{pecas} pç</span>
          <span>{formatarPreco(subtotal)}</span>
        </dd>
      </div>
      {desconto > 0 && (
        <div className="flex justify-between gap-4 py-3 text-sucesso">
          <dt>Cupom {cupom}</dt>
          <dd>− {formatarPreco(desconto)}</dd>
        </div>
      )}
      {entrega && (
        <div className="flex justify-between gap-4 py-3">
          <dt>{entrega.titulo}</dt>
          <dd>{formatarPreco(entrega.valor)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4 py-3 font-bold">
        <dt>Total</dt>
        <dd>{formatarPreco(total)}</dd>
      </div>
    </dl>
  );
}
