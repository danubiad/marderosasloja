import { TelaCarrinho } from "@/components/telas/TelaCarrinho";
import { disponibilidadeAtual } from "@/lib/estoque";

export default async function Carrinho() {
  return <TelaCarrinho disponibilidade={await disponibilidadeAtual()} />;
}
