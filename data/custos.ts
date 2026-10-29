// Preço de custo de cada produto (id -> R$), tirado das notas .txt nas pastas de Imagens/catalogo.
// Só o painel lê. O custo digitado no painel vale mais que este.
// Quando a nota tem custo diferente no EXG, aqui fica o de P a GG.

export const custosPorProduto: Record<string, number> = {
  "1": 42.90, // Baby Doll Diamante Borboleta
  "2": 18.00, // Baby Doll Mônica
  "3": 42.90, // Baby Doll Babadinho Diamante
  "4": 30.00, // Baby Doll Bolsinho
  "5": 38.61, // Baby Doll Cropet
  "6": 28.00, // Baby Doll Felícia
  "7": 30.51, // Baby Doll Infantil
  "8": 33.90, // Baby Doll Luciana (EXG 36,00)
  "9": 32.40, // Baby Doll Magna
  "10": 24.00, // Baby Doll Mayara (EXG 30,00)
  "11": 28.00, // Baby Doll Short Curto
  "12": 32.00, // Baby Doll Tifany
  "13": 32.00, // Baby Doll Triângulo
  "36": 31.45, // Baby Doll Karen (EXG 34,11)
  "44": 30.00, // Baby Doll Helen
  "50": 30.00, // Baby Doll Kelly
  "51": 30.00, // Baby Doll Babadinho
  "75": 35.00, // Baby Doll Shakira
  "78": 27.00, // Baby Doll Lilia
  "80": 28.00, // Baby Doll Moniky
  "84": 32.00, // Baby Doll Wayne
  "85": 38.00, // Baby Doll Algodão Bordado
  "15": 34.00, // Camisola Vivian
  "105": 100.00, // Kit de Calcinha Mag
  "106": 30.00, // Short Doll Estampado (XG: custo não informado)
  "107": 33.30, // Conjunto Belle
  "108": 30.00, // Conjunto Bia (EXG: 36,00)
  "109": 35.10, // Conjunto com Bojo Removível
  "110": 30.00, // Conjunto Mab (EXG: 36,00)
  "111": 28.00, // Conjunto Sem Bojo Marília
  "112": 35.00, // Conjunto Cropet Bianca
  "45": 32.00, // Pijama Americano Alça (nota da pasta "Pijama americano Lais", 27/10)
  "114": 90.00, // Kit Robe e Camisola com Bojo
  "113": 39.00, // Pijama Americano Cropped Manga Curta
  "115": 28.00, // Pijama Americano Simples
  "116": 28.00, // Pijama Mãe e Filha Novas Estampas (mãe; filha: 26,00)
  "117": 36.00, // Conjunto de Tule Sem Bojo
  "118": 35.00, // Conjunto Tomara que Caia
  "126": 38.00, // Pijama Masculino
};
