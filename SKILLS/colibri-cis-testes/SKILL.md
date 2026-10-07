---
name: colibri-cis-testes
description: 'CIS (ColibriServer) em teste no ambiente local: use quando for preciso testar a API REST do CIS isolado em outra porta, ou integrado ao POS ou a outro client. Não use só para compilar (use delphi-xe2-build), para testes .NET com PostgreSQL (use pgsql-test-runner) nem em ambiente de produção.'
argument-hint: 'Descreva o teste e se ele envolve o POS ou outro client além do CIS.'
---

# Testes do CIS

Executa testes do ColibriServer (CIS) no ambiente local deixando a instalação como estava: o banco do POS fica protegido por um snapshot e o serviço instalado só para quando o teste precisa da porta padrão.

`<pasta-da-skill>` é a pasta deste `SKILL.md`.

## Referência do ambiente

| Item | Valor |
| --- | --- |
| Serviço | `colibri_server` ("Colibri CIS"), que executa `C:/Sistema Colibri/server/Cis/ColibriServer.exe` |
| Porta | 4300 por padrão (`[Portas] colibri_server`); `-porta <n>` sobrepõe |
| URL | `http://localhost:<porta>/v1/<recurso>/` — o prefixo `/api/v1` responde 404 |
| `api_key` | Sempre a chave de testes `BD575CC3-4F03-4C1B-AA4C-C05FC742F189`, por query (`?api_key=`) ou header `api_key`. Ela só existe em ambientes de teste. |
| Basic | `Authorization: Basic dGVzdGU6MTIzNA==` (usuário `teste`, senha `1234`) |
| Diagnóstico | `GET /v1/aplicativo/info/?api_key=…` devolve `dados.app` (exe em execução) e `dados.conexao.banco` |
| Encerramento | `GET /v1/aplicativo/finalizar/?api_key=…` fecha o processo |
| Fonte | `D:/Projetos/pos/source/ColibriServer/prj/ColibriServer.dproj`; coleções Postman em `D:/Projetos/pos/source/ColibriServer/postman/` |

**Pasta base e `ncrmaster.cfg`.** O CIS sobe da pasta do exe até a primeira pasta cujo nome contém `solution`, `colibri-`, `-colibri`, `colibri ` ou ` colibri` e lê `<base>/master/config/ncrmaster.cfg`. O exe instalado lê `C:/Sistema Colibri/master/config/ncrmaster.cfg`; o compilado em `D:/Projetos/sistema-colibri/server/cis` lê `D:/Projetos/sistema-colibri/master/config/ncrmaster.cfg`. Por isso o passo 4 confere o banco que o CIS realmente abriu.

## Passo 1: Classificar o teste

1. Escolha o modo:
   - **Isolado** — só requisições HTTP ao CIS. Rode um exe próprio numa porta livre diferente de 4300 (confira com `Get-NetTCPConnection -LocalPort <porta> -State Listen`); o serviço instalado continua no ar.
   - **Integração** — o POS ou outro client participa. Esses clients apontam para a porta 4300, então o serviço `colibri_server` precisa parar.
2. Escolha o exe: `D:/Projetos/sistema-colibri/server/cis/ColibriServer.exe` quando o teste valida código alterado; `C:/Sistema Colibri/server/Cis/ColibriServer.exe` quando valida o comportamento instalado.

*Pronto quando:* modo, exe e porta estão definidos e a porta do modo isolado está livre.

## Passo 2: Compilar (só se o código alterado ainda não foi compilado)

1. Compile com a skill `delphi-xe2-build`, na ordem de `D:/Projetos/pos/colibri-server.groupproj` (`agileLib`, `colibriLib`, `ColibriServer`), passando `-ExeOut D:/Projetos/sistema-colibri/server/cis`. Esse destino já está autorizado; as demais saídas (DCU, BPL, DCP) seguem as regras daquela skill. Passe o destino explicitamente: a variável `SISTEMA_COLIBRI` aponta para outra pasta (`D:/Projetos/Sistema Colibri/`).
2. Se `ColibriServer.log.config` faltar na pasta de saída, copie-o de `C:/Sistema Colibri/server/Cis`.

*Pronto quando:* `ColibriServer.exe` em `D:/Projetos/sistema-colibri/server/cis` tem data e hora desta compilação.

## Passo 3: Proteger o banco

Rode `pwsh <pasta-da-skill>/scripts/Invoke-CisSnapshot.ps1 -Acao Criar` (**mutating**). O script lê `banco_pos` e `servidor` da seção `[Banco]` de `C:/Sistema Colibri/master/config/ncrmaster.cfg` e cria o snapshot `<banco>_cis_teste`. `-Acao Status` (**read-only**) lista os snapshots do banco.

- "já existe": é sobra de uma execução anterior. Pergunte ao usuário se restaura ou remove antes de seguir.
- Aviso de snapshots de terceiros: o SQL Server só restaura um banco que tenha um único snapshot, então a restauração do passo 6 ficará bloqueada. Informe os nomes ao usuário agora e siga só com a concordância dele. Snapshots de terceiros pertencem ao usuário: quem os remove é ele.

*Pronto quando:* o script respondeu "criado" e o usuário sabe se a restauração final será possível.

## Passo 4: Subir o CIS

1. Modo isolado: `$cis = Start-Process '<exe>' -ArgumentList '-porta','<porta>' -PassThru`.
2. Modo integração: imprima para o usuário rodar num prompt elevado

   ```powershell
   Stop-Service colibri_server
   ```

   Aguarde a confirmação, verifique `(Get-Service colibri_server).Status` igual a `Stopped` e a porta 4300 sem listener, e só então rode `$cis = Start-Process '<exe>' -PassThru`.
3. Consulte `/v1/aplicativo/info/` até responder (poucos segundos). Confira `dados.app` contra o exe escolhido e `dados.conexao.banco` contra o banco do snapshot. Banco diferente: encerre o CIS e informe o usuário, porque o snapshot protegeu outro banco. Processo que fecha logo após subir indica outra instância na mesma porta: escolha outra porta.

*Pronto quando:* `/v1/aplicativo/info/` responde na porta escolhida com o exe e o banco conferidos.

## Passo 5: Executar os testes

Monte cada requisição com a URL, a `api_key` e o header Basic da referência. Registre por caso: método, rota, status HTTP e o trecho da resposta que prova o resultado. Marque se o teste alterou dados: qualquer `POST`, `PUT` ou `DELETE`, operação de venda ou consumo, ou ação feita no POS.

*Pronto quando:* todo caso pedido tem status e evidência registrados e a marcação "alterou dados" está decidida.

## Passo 6: Encerrar e restaurar

1. Chame `/v1/aplicativo/finalizar/` e confirme `$cis.WaitForExit(15000)`; se o processo seguir vivo, `Stop-Process -Id $cis.Id`.
2. Com dados alterados, rode `pwsh <pasta-da-skill>/scripts/Invoke-CisSnapshot.ps1 -Acao Restaurar` (**mutating**). Ela derruba com `ROLLBACK IMMEDIATE` todas as conexões ao banco, inclusive as dos serviços instalados. Se for bloqueada por snapshots de terceiros, mantenha o snapshot da skill e entregue ao usuário o comando para restaurar depois que ele remover os outros. Se o banco ficar em `SINGLE_USER` após uma falha, devolva o acesso com `sqlcmd -S <servidor> -E -Q "ALTER DATABASE [<banco>] SET MULTI_USER"` antes de qualquer outra ação.
3. Rode `-Acao Remover` (**mutating**) depois de restaurar ou quando o teste não alterou dados: um snapshot esquecido bloqueia restaurações futuras.
4. Modo integração: imprima para o usuário rodar num prompt elevado

   ```powershell
   Start-Service colibri_server
   ```

*Pronto quando:* o CIS de teste terminou, o banco foi restaurado (ou o motivo de não restaurar está registrado), o snapshot da skill foi removido ou mantido com motivo, e no modo integração o comando de religar o serviço foi impresso.

Feche com um resumo: modo, exe e porta, resultado por caso e o estado final do banco e do serviço.
