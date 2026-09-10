# Fluxo de lentes BARCH

Prévia baseada em `Tabela de Lentes.xlsx`, recebida em 09/09/2026. A ordem segue o padrão do fluxo da Cacife: WhatsApp, necessidade, tratamento ou modelo, receita, cor quando aplicável, indicação e carrinho.

## Cobertura

- Visão simples: antirreflexo, filtro azul e Transitions.
- Multifocal: Básico, Intermediário e Avançado, com ou sem antirreflexo PRIME.
- Sem grau: filtro azul para armação comum ou sem aro.
- Solar com grau: preto ou marrom, para armação comum ou sem aro.
- Leitura automática de receita por foto ou PDF, com conferência manual.

A indicação valida os dois olhos, incluindo limites negativos e positivos de ESF, CIL e adição. Casos fora das faixas seguem para atendimento da BARCH.

## Preços

A prévia usa os preços da planilha. A loja ainda exibe preços diferentes para Transitions e parte dos multifocais. Esses produtos deverão ser atualizados antes da ativação do novo catálogo no carrinho.

## Segurança da prévia

`preview-lentes.html` define `BARCH_LENTES_PREVIEW`. Nesse modo, o telefone e os eventos não são enviados, o WhatsApp não abre e o carrinho é demonstrativo. Somente a foto ou o PDF escolhido é enviado ao leitor automático de receita. O comportamento existente da loja permanece inalterado quando essa opção não está ativa.

O resultado oferece apenas a compra da armação com as lentes indicadas. Não há opção de comprar somente a armação dentro do fluxo.
