// Recorta um pedaço do tecido/estampa de uma foto para usar na bolinha de cor.
//
// Uso:
//   npm run amostra -- <foto> <saida> <x%> <y%> [tamanho%]
//
//   foto      caminho da foto original (ex.: public/produtos/mr-101-preto.jpg)
//   saida     nome do recorte, sem extensão (ex.: mr-101-preto) -> public/produtos/amostras/mr-101-preto.webp
//   x%, y%    centro do recorte, em % da largura e da altura da foto (0 a 100)
//   tamanho%  lado do recorte, em % do lado menor da foto (padrão 12)
//
// Também mostra a cor média do centro do recorte, para usar no campo `hex` do produto.

import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const [foto, saida, xArg, yArg, tamArg = "12"] = process.argv.slice(2);
if (!foto || !saida || xArg === undefined || yArg === undefined) {
  console.error("Uso: npm run amostra -- <foto> <saida> <x%> <y%> [tamanho%]");
  process.exit(1);
}

const imagem = sharp(foto).rotate(); // respeita a orientação EXIF de fotos de celular
const { width, height } = await imagem.metadata();
const lado = Math.max(8, Math.round((Math.min(width, height) * Number(tamArg)) / 100));
const cx = Math.round((width * Number(xArg)) / 100);
const cy = Math.round((height * Number(yArg)) / 100);
const left = Math.min(Math.max(0, cx - Math.round(lado / 2)), width - lado);
const top = Math.min(Math.max(0, cy - Math.round(lado / 2)), height - lado);

const destino = path.join("public", "produtos", "amostras", `${saida}.webp`);
await mkdir(path.dirname(destino), { recursive: true });

const recorte = sharp(foto).rotate().extract({ left, top, width: lado, height: lado }).resize(160, 160);
await recorte.clone().webp({ quality: 85 }).toFile(destino);

// Cor média do miolo do recorte (as bordas costumam pegar fundo ou sombra)
const miolo = await recorte.clone().png().toBuffer();
const { channels } = await sharp(miolo).extract({ left: 40, top: 40, width: 80, height: 80 }).stats();
const hex = "#" + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");

console.log(`Recorte salvo em ${destino}`);
console.log(`  amostra: "/produtos/amostras/${saida}.webp"`);
console.log(`  hex: "${hex}"`);
