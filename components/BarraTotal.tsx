import { formatarPreco } from "@/lib/format";

type Props = {
  total: number;
  rotulo: string;
  desabilitado?: boolean;
  carregando?: boolean;
  aviso?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  form?: string;
};

/** Barra fixa no rodapé com o total e o botão principal, como na Vesti. */
export function BarraTotal({ total, rotulo, desabilitado, carregando, aviso, onClick, type = "button", form }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {aviso && <p className="bg-amber-50 px-4 py-2 text-center text-sm text-orange-700">{aviso}</p>}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <div>
          <p className="text-sm text-suave">Total</p>
          <p className="text-xl font-bold">{formatarPreco(total)}</p>
        </div>
        <button
          type={type}
          form={form}
          onClick={onClick}
          disabled={desabilitado || carregando}
          className="min-w-44 rounded-md bg-sucesso px-6 py-3 text-lg font-bold text-white disabled:opacity-40"
        >
          {carregando ? "Enviando..." : rotulo}
        </button>
      </div>
    </div>
  );
}
