import { TelaFinalizar } from "@/components/telas/TelaFinalizar";
import { disponibilidadeAtual } from "@/lib/estoque";

export default async function Finalizar() {
  return <TelaFinalizar disponibilidade={await disponibilidadeAtual()} />;
}
