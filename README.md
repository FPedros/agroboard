# Agroboard Starter

Base inicial derivada do projeto original, mantendo:

- Tela de login
- Sidebar (menu lateral)
- Tema claro/escuro
- Paleta de cores atual

## Modo mock atual

- Login sem validacao: basta clicar em `Entrar`
- Produtos na sidebar:
  - `AgroOne`
  - `AgroTerra`
  - `AgroTracker`
  - `AgroValora`
  - `BD-Online`
  - `CropData`
- Home com comparativo de performance:
  - Mes a mes (grafico por ano)
  - Ano a ano (mes selecionado)
- Tela individual de cada produto com:
  - Modelo de venda
  - Regras comerciais
  - Faturamento, custo e performance por mes/ano

## Estrutura atual

- `/` Login
- `/app` Home com comparativos
- `/app/produtos/:productId` Visao individual do produto
