# Feira — Raffiner × Tânia Veiga

Formulário touchscreen para captura de leads em totem de feira. Roda **100% offline**: os dados são salvos em CSV local, sem dependência de internet ou serviços externos.

Os QR Codes no canto da tela abrem os sites das marcas (Raffiner e Tânia Veiga) num overlay com iframe, sem sair do formulário. Feche pelo ×, pela tecla Esc ou tocando fora do painel. Abrir os sites exige conexão com a internet.

## Requisitos

- [Node.js](https://nodejs.org/) 20+ (LTS recomendado)
- npm 10+

## Uso na feira

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (em geral `http://localhost:5173`) em tela cheia no totem.

> **Importante:** use sempre `npm run dev` na feira. A gravação em CSV só funciona com o servidor de desenvolvimento do Vite. `npm run preview` serve o build estático e **não** persiste leads.

## Dados

Cada envio do formulário acrescenta uma linha em [`data/leads.csv`](data/leads.csv).

| Coluna       | Descrição                          |
| ------------ | ---------------------------------- |
| `id`         | UUID gerado no servidor            |
| `nome`       | Nome (obrigatório)                 |
| `empresa`    | Empresa (opcional)                 |
| `whatsapp`   | WhatsApp                           |
| `created_at` | Data/hora ISO do cadastro          |
| `instagram`  | Instagram (opcional; campo oculto) |

O arquivo já contém o histórico exportado. Novos leads são apenas **append** — o arquivo não é recriado nem truncado.

## Scripts

| Comando         | Função                                      |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Sobe o totem + API local de leads (produção na feira) |
| `npm run build` | Gera o build de produção em `dist/`         |
| `npm run lint`  | Roda o oxlint                               |
| `npm run preview` | Preview do build (sem API de CSV)         |

## Stack

- React 19 + TypeScript
- Vite 8
- Persistência via middleware Vite → `data/leads.csv`
