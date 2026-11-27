# Como expandir a skill

Uma descoberta vira, no mínimo, um arquivo de caso. A checagem automática é opcional.

```
references/casos/<id>.md           conhecimento (um por problema)
references/INDICE.md               gerado; não edite
scripts/checagens/<modulo>.py      detecção estática (opcional), descoberta automaticamente
scripts/test_skill.py              testes das checagens
```

## Onde a mudança fica

A skill vive em `SKILLS/dotnet-multiplataforma` do repositório `agents-instructions`; os projetos recebem links
para o clone. O que você grava aqui altera esse clone, não o projeto em que está trabalhando, e só chega aos outros
depois de commit e push lá. Rode os comandos abaixo a partir da pasta da skill. Commit e push dependem de pedido do
usuário.

## Antes de criar

Procure um caso existente: `catalogo.py buscar <log>` e `references/INDICE.md`. Se o problema já estiver lá,
acrescente a assinatura, a variação ou a armadilha no mesmo arquivo. Se uma receita falhou, corrija-a e rebaixe o
`status` se for o caso; informação errada custa mais que informação ausente.

## Caso novo

1. `python3 scripts/catalogo.py novo <id> --titulo "..."` (id em minúsculas com hífens).
2. Preencha o arquivo. Campos do cabeçalho:
   - `fase`: `restore`, `build`, `pos-build`, `teste` ou `execucao`.
   - `status`: `confirmado`, `sintoma-confirmado` ou `hipotese`. Só é `confirmado` o que foi compilado ou
     executado com a correção aplicada.
   - `verificado_em`: sistema, versão do SDK e data. Diga o que ficou sem testar (normalmente o outro sistema).
   - `sinais`: uma expressão regular por linha, iniciada por `  - `, sem aspas. Prefira códigos de erro, que não
     mudam com o idioma do SDK.
3. Escreva o caso de forma geral. Caminhos e nomes de um projeto específico ficam só como exemplo em Evidência,
   e segredos (cadeias de conexão, tokens) não entram.

## Checagem automática (quando dá para detectar lendo arquivos)

Crie `scripts/checagens/<modulo>.py` com uma função:

```python
from comum import ler, linha_de, sem_comentarios

def checar(repo):
    for arquivo in repo.msbuild():
        texto = sem_comentarios(ler(arquivo)[0])
        ...
        yield repo.achado("<id-do-caso>", arquivo, linha_de(texto, posicao), "detalhe curto")
```

`repo` oferece `arquivos(*sufixos)`, `pastas()`, `msbuild()`, `relativo()` e `submodulo()`. Em `comum.py` há
`restrito_por_so()` para ignorar o que já está condicionado ao sistema. Mantenha a checagem somente leitura e só
com a biblioteca padrão. Depois informe `checagem: <modulo>` no caso.

Acrescente em `test_skill.py` um exemplo que deve ser apontado e um parecido que não deve.

## Fechar

```
python3 scripts/catalogo.py indice
python3 scripts/catalogo.py validar
python3 -B -m unittest discover -s scripts -p "test_*.py"
```

Uma correção automática (como `corrigir_caixa.py`) só vale a pena quando a mudança é mecânica e sem ambiguidade;
deve mostrar a prévia por padrão e gravar só com `--aplicar`.
