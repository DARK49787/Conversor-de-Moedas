# Conversor de Moedas

Aplicação web para converter valores entre Real (BRL), Dólar (USD), Euro (EUR) e Bitcoin (BTC), com frontend responsivo e backend leve em Node.js.

## Funcionalidades
- Conversão entre BRL, USD, EUR e BTC.
- Interface limpa e adaptável para desktop, tablet e celular.
- Backend com endpoint `/api/rates` para centralizar a busca de cotações.
- Endpoint `/api/compare` para gerar micro comparações de preço entre moedas.
- Endpoint `/api/export.csv` para exportar a tabela comparativa em CSV.
- Validação de entrada e mensagens de erro/sucesso para melhor experiência.

## Como executar
1. Instale o Node.js 18+.
2. No diretório do projeto, execute:
   ```bash
   npm start
   ```
3. Acesse no navegador:
   ```
   http://localhost:3000
   ```

## Tecnologias utilizadas
- HTML
- CSS
- JavaScript
- Node.js (HTTP nativo)
