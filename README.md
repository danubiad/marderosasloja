# Mar de Rosas Lingerie — Catálogo Atacado

Catálogo de atacado com grade de quantidades (cor × tamanho), carrinho, cupom, pedido mínimo,
checkout com CPF/CNPJ, endereço por CEP e formas de entrega. Os pedidos ficam salvos com número
e link de conferência, e a cliente envia o pedido para o WhatsApp da loja.

## Onde editar

- **Produtos:** `data/produtos.ts` (fotos em `public/produtos/`)
- **Loja, WhatsApp, pedido mínimo, entregas e cupons:** `lib/config.ts`

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem banco configurado, os pedidos de teste ficam em `.data/pedidos.json`.

## Publicar na Vercel

1. Importe este repositório na Vercel.
2. Em **Storage**, crie um banco **Upstash for Redis** e conecte ao projeto
   (isso cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`).
3. Faça um novo deploy.
