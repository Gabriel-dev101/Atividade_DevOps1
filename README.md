
# Atividade_DevOps1

# FinanX — Conversor de Moedas

Aplicação front-end para conversão de valores entre moedas com cotação online.

## Funcionalidades
- Conversão de valores entre moedas usando a API Frankfurter.
- Inversão rápida das moedas selecionadas.
- Cópia do resultado da conversão.
- Interface com fundo preto e texto verde.

## Tecnologias
HTML5, CSS3, JavaScript, Node.js Test Runner, GitHub Actions, Semgrep e OWASP ZAP.

## Como executar
1. Baixe ou clone o repositório.
2. Abra a pasta no VS Code.
3. Inicie um servidor local, por exemplo com `python -m http.server 8080`.
4. Acesse `http://localhost:8080`.

A conversão de moedas precisa de conexão com a internet para consultar a API Frankfurter.

## Executar os testes
É necessário ter Node.js 22 ou superior instalado:
```bash
node --test conversions.test.js
```

## Pipeline
O workflow `.github/workflows/pipeline.yml` executa em sequência:
1. Testes automatizados com Node.js.
2. Análise estática SAST com Semgrep.
3. Análise dinâmica DAST com OWASP ZAP Baseline.

O ZAP está configurado para não interromper o workflow por alertas de nível WARN. Esses avisos continuam aparecendo no relatório e devem ser avaliados; pipeline verde não significa ausência total de vulnerabilidades.

