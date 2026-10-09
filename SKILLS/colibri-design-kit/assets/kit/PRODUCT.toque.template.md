# [Nome do produto — ex.: Colibri Totem]

<!-- impeccable:product-schema 1 -->

<!-- Modelo de PRODUCT.md para produtos Colibri só com o perfil Toque (cardápio em tablet, totem, KDS,
     painel de pedidos prontos), no formato do impeccable 4.x. Produto com admin e telas de toque usa
     PRODUCT.template.md e acrescenta as superfícies de toque em Users e Operating Context. Copie para a
     raiz do repositório como PRODUCT.md e substitua os trechos entre colchetes. As seções já preenchidas
     valem para todo produto de toque da linha Colibri; ajuste somente se o produto tiver uma necessidade
     diferente. Mantenha o comentário impeccable:product-schema acima; remova este. -->

## Platform

web

## Users

[Quem usa cada superfície, em que contexto e com que frequência. Ex.: o cliente da loja no cardápio, no totem e no painel de pedidos prontos; a equipe de cozinha e expedição no KDS; o atendente no menu de serviço.]

## Product Purpose

[O que o produto precisa permitir fazer. Qual é a tela mais usada e o que ela precisa favorecer (ex.: achar o produto, montar o pedido e pagar sem ajuda).]

## Positioning

[Uma frase: o lugar onde [quem] faz [o quê].]

## Operating Context

Telas de toque em uso contínuo no salão, no balcão e na cozinha: tablet na mesa, à distância do braço; totem, com a pessoa em pé; monitor ou TV da cozinha, lido a 1–3 m com as mãos ocupadas; painel de pedidos prontos, lido de longe. Aparelhos muitas vezes de entrada, com Android WebView antigo, em modo quiosque, sem teclado nem mouse. [Fluxos, horários de pico e rotinas do produto em que as telas são usadas.]

## Capabilities and Constraints

- O produto precisa funcionar sem acesso à internet: fontes, ícones e estilos são servidos por ele mesmo.
- Piso de navegador Chrome 101 (WebView dos tablets e totens).
- Cada canal de venda tem o seu esquema de cores, escolhido pelo lojista com três sementes (ambiente, ação, marca); as telas de operação usam o tema Colibri.
- [Funcionalidades confirmadas, restrições técnicas e termos do produto.]

## Brand Commitments

Linha visual Colibri, perfil Toque ("Ponto de atendimento"), definida pelo Colibri Design Kit e registrada em `DESIGN.md`. Nas telas voltadas ao cliente, a loja aparece pelo logo, pelo nome e pelo esquema de cores do canal; a marca Colibri fica no ícone do aplicativo, na abertura e no admin.

Personalidade: claro, objetivo e confiável. A linguagem é curta e direta; a ação principal e a informação que importa (preço, senha, tempo, quantidade) têm prioridade sobre ornamentação.

Anti-references:

- Cardápio que parece anúncio, com banners, animações chamativas e texto promocional disputando com o produto e o preço.
- Interface infantilizada, com cantos muito arredondados, emojis como ícone e cor saturada em tudo.
- Botões pequenos e ações escondidas em gestos ou que só aparecem ao tocar em outro lugar.
- Estado e urgência indicados só pela cor, ou telas da cozinha que piscam sem dizer o porquê.

## Product Principles

- Uma tarefa por tela; a ação principal sempre visível e ao alcance.
- [Reservar o caminho mais curto para a tela mais usada: …]
- Preço, senha, tempo e quantidade legíveis de onde a pessoa está.
- Nunca deixar a pessoa sem saída: voltar, cancelar e chamar o atendente sempre disponíveis.
- Funcionar no aparelho real: sem internet, em WebView antiga, com o dedo, sem teclado.

## Accessibility & Inclusion

Usar WCAG 2.2 AA como referência: contraste garantido pelo esquema de cores, alvos de toque no mínimo da superfície (seção 9 do `DESIGN.md` do kit), estado sempre com rótulo ou ícone e alternativa a movimento. Quantidades e confirmações são anunciadas a leitores de tela; o tempo esgotado avisa antes e permite continuar; o foco fica visível quando houver teclado ou bump bar.
