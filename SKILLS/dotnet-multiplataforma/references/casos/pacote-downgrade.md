---
id: pacote-downgrade
titulo: NU1605, downgrade de pacote tratado como erro
fase: restore
status: confirmado
checagem: nenhuma
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - NU1605
---

## Sintoma

`error NU1605: Aviso como Erro: Downgrade de pacote detectado: <Pacote> de X para Y`.

## Causa

O projeto fixa uma versão menor que a exigida por uma dependência, muitas vezes um submódulo que avançou sem o
repositório principal. Provavelmente falha também no Windows: não presuma que é problema de portabilidade.

## Correção

Alinhe a versão direta à exigida, depois de confirmar com o usuário, pois muda o que é entregue. Confira antes se o
submódulo está no commit registrado (`git submodule status`, prefixo `+` indica diferença).

## Armadilhas

Esse erro interrompe o restore e esconde todos os problemas de compilação. Não suprima o aviso.

## Evidência

Um repositório; subir a referência direta para a versão exigida permitiu compilar.
