// Datas no fuso de Brasília, no formato AAAA-MM-DD.

const DIA_MS = 86_400_000;

export function diaSP(momento: Date | number | string = Date.now()) {
  return new Date(momento).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Os últimos `n` dias, de hoje para trás. */
export function ultimosDias(n: number, agora = Date.now()) {
  return Array.from({ length: n }, (_, i) => diaSP(agora - i * DIA_MS));
}

/** Dia da semana (0 = domingo) de um dia AAAA-MM-DD. */
export function diaDaSemana(dia: string) {
  return new Date(`${dia}T12:00:00Z`).getUTCDay();
}

export function diasNoMes(dia: string) {
  const [ano, mes] = dia.split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}
