"""Testes do inventario.py. Executar: python test_inventario.py (cria repositórios falsos em pasta temporária)."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import inventario  # noqa: E402

TOKEN_FALSO = "ghp_" + "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8"
CHAVE_FALSA = "6EBD6A1F-0000-4E7D-A509-1DF959FA0237"


def escrever(raiz: Path, caminho: str, texto: str) -> None:
    destino = raiz / caminho
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding="utf-8")


class InventarioTestes(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self.tmp.name)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def rodar(self) -> dict:
        return inventario.inventariar(self.raiz, 8)

    def test_submodulo_declarado_sem_gitlink_aparece_sem_pasta(self) -> None:
        escrever(self.raiz, ".gitmodules", '[submodule "_lib"]\n\tpath = _lib\n\turl = ssh://git@github.com/ColibriAgile/dotnet-lib.git\n')
        dados = self.rodar()["git"]
        self.assertEqual(dados["gitlinks"], [])
        self.assertEqual(dados["submodules"][0]["path"], "_lib")
        self.assertFalse(dados["submodules"][0]["url_tem_credencial"])
        self.assertFalse(dados["pastas_de_submodulo"]["_lib"])

    def test_token_na_url_do_submodulo_e_detectado_sem_vazar_o_valor(self) -> None:
        escrever(self.raiz, ".gitmodules",
                 f'[submodule "_lib"]\n\tpath = _lib\n\turl = https://{TOKEN_FALSO}@github.com/ColibriAgile/dotnet-lib.git\n')
        saida = self.rodar()
        self.assertTrue(saida["git"]["submodules"][0]["url_tem_credencial"])
        self.assertIn("token_github", {s["tipo"] for s in saida["segredos"]["suspeitos"]})
        self.assertNotIn(TOKEN_FALSO, json.dumps(saida))

    def test_literal_em_arquivo_de_segredo_e_detectado_sem_vazar_o_valor(self) -> None:
        escrever(self.raiz, "App/EmbeddedApiKey.cs", f'class K {{ private const string Constante = "{CHAVE_FALSA}"; }}\n')
        saida = self.rodar()
        self.assertEqual(saida["segredos"]["suspeitos"][0]["tipo"], "literal_em_arquivo_de_segredo")
        self.assertNotIn(CHAVE_FALSA, json.dumps(saida))

    def test_nome_de_chave_de_configuracao_nao_e_segredo(self) -> None:
        escrever(self.raiz, "App/Chaves.cs", 'class C { public const string CisApiKey = "cis.api_key"; const string Chave = "menu.porta"; }\n')
        self.assertEqual(self.rodar()["segredos"]["suspeitos"], [])

    def test_csproj_props_pacotes_e_projeto_de_teste(self) -> None:
        escrever(self.raiz, "App/App.csproj", """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)'=='Release'"><PublishSingleFile>true</PublishSingleFile></PropertyGroup>
  <ItemGroup><ProjectReference Include="..\\_lib\\CoLib.Logging\\CoLib.Logging.csproj" /></ItemGroup>
  <Import Project="..\\_lib\\CoLib.Polly\\Polly.projitems" Label="Shared" />
</Project>""")
        escrever(self.raiz, "App.Testes/App.Testes.csproj", """<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup><PackageReference Include="xunit.v3" Version="4.0.2" /></ItemGroup>
</Project>""")
        csproj = {c["path"]: c for c in self.rodar()["csproj"]}
        app = csproj["App/App.csproj"]
        self.assertEqual(app["props"]["TargetFramework"], "net10.0")
        self.assertTrue(any(k.startswith("PublishSingleFile [") for k in app["props"]))
        self.assertEqual(app["project_references"], ["../_lib/CoLib.Logging/CoLib.Logging.csproj"])
        self.assertEqual(app["imports"], ["../_lib/CoLib.Polly/Polly.projitems"])
        self.assertFalse(app["is_test"])
        self.assertTrue(csproj["App.Testes/App.Testes.csproj"]["is_test"])

    def test_sinais_ignoram_comentarios_e_medem_logs(self) -> None:
        escrever(self.raiz, "App/Program.cs", """
// builder.Host.UseLogging(x => x);  comentário não conta
builder.Host.UseLogging(log => log.WithLogPath(PastasDoSistema.Logs).WithLogFileNameTemplate("{ApplicationName}_{Date}.logc"));
builder.WebHost.ConfigureKestrel(o => o.ListenAnyIP(porta));
log.LogInformation("Pedido lançado|Id={Id}", id);
log.LogWarning("Falhou: {Erro}", ex.Message);
log.LogError(
    $"Interpolado {id}");
""")
        sinais = self.rodar()["sinais"]
        self.assertEqual(sinais["use_logging"]["total"], 1)
        self.assertEqual(sinais["use_logging"]["amostras"], ["App/Program.cs:3"])
        self.assertEqual(sinais["pastas_do_sistema_logs"]["total"], 1)
        self.assertEqual(sinais["kestrel"]["total"], 2)
        logs = sinais["log_calls"]
        self.assertEqual((logs["total"], logs["com_pipe"], logs["ex_message"], logs["interpolados"]), (3, 1, 1, 1))

    def test_pastas_ignoradas_nao_entram(self) -> None:
        escrever(self.raiz, "_lib/CoLib.X/Program.cs", "x.UseLogging(c => c);\n")
        escrever(self.raiz, "App/bin/Debug/a.cs", "x.UseLogging(c => c);\n")
        self.assertEqual(self.rodar()["sinais"]["use_logging"]["total"], 0)

    def test_build_workflows_e_config(self) -> None:
        escrever(self.raiz, ".build/versao.ini", "[versaoinfo]\nMajorVersion = 1\nMinorVersion = 2\nRelease = 3\n")
        escrever(self.raiz, ".build/app.iss", '#define PastaInno "..\\_lib-inno"\n#include PastaInno + "\\servico.iss"\n'
                                              'Parameters: "install colibri_app"\n')
        escrever(self.raiz, ".build/pacote/manifesto.server",
                 '{"nome":"app","portas":[{"nome":"app","porta_default":6900,"servico":"colibri_app"}],"dependencias":{"DotnetCore":"10.*"}}')
        escrever(self.raiz, ".github/workflows/build.yml", "name: Build\non:\n  workflow_dispatch:\n  push:\n    branches: [production]\n"
                                                           "jobs:\n  b:\n    runs-on: [self-hosted, colibri]\n    steps:\n"
                                                           "    - uses: ColibriAgile/build-tools/.github/actions/publish-dotnet@master\n"
                                                           "      with:\n        additional-publish-args: --property:PublishSingleFile=true\n")
        escrever(self.raiz, "App/appsettings.Development.json", '{\n  "Port": 5002\n}\n')
        saida = self.rodar()
        self.assertEqual(saida["build"]["versao_ini"][0]["MinorVersion"], "2")
        self.assertEqual(saida["build"]["iss"][0]["pasta_inno"], "..\\_lib-inno")
        self.assertEqual(saida["build"]["manifestos"][0]["portas"][0]["porta_default"], 6900)
        wf = saida["workflows"][0]
        self.assertIn("ColibriAgile/build-tools/.github/actions/publish-dotnet@master", wf["uses"])
        self.assertIn("workflow_dispatch:", "\n".join(wf["on"]))
        self.assertTrue(wf["publish_args"])
        self.assertEqual(saida["config_json"][0]["linhas"], ['2: "Port": 5002'])

    def test_renovate_resume_a_base_colibri_mesmo_com_arquivo_longo(self) -> None:
        regras_do_produto = [{"description": f"regra {i} do produto " + "x" * 80, "enabled": False} for i in range(10)]
        texto = json.dumps({
            "$schema": "https://docs.renovatebot.com/renovate-schema.json",
            "extends": ["config:recommended"],
            "dependencyDashboard": True,
            "git-submodules": {"enabled": True},
            "packageRules": [
                {"matchCategories": ["dotnet"], "enabled": True},
                {"groupName": "Microsoft packages", "schedule": ["after 1am and before 8am every weekday"],
                 "matchPackageNames": ["/^Microsoft\\./"]},
                {"description": "Ignore NuGet packages pinned to an exact version", "matchManagers": ["nuget"],
                 "matchCurrentValue": "/^\\[[^,]+\\]$/", "enabled": False},
                *regras_do_produto,
            ],
            "automerge": False,
            "prHourlyLimit": 15,
            "prConcurrentLimit": 15,
        }, indent=2)
        self.assertGreater(len(texto), 1500)
        escrever(self.raiz, "renovate.json", texto)
        info = self.rodar()["raiz_arquivos"]["renovate"]
        self.assertLess(len(info["conteudo"]), 1501)
        resumo = info["resumo"]
        self.assertEqual(resumo["schema"], "https://docs.renovatebot.com/renovate-schema.json")
        self.assertTrue(resumo["git_submodules"])
        self.assertTrue(resumo["categoria_dotnet_ligada"])
        self.assertTrue(resumo["nuget_exato_desligado"])
        self.assertEqual(resumo["grupos"][0]["schedule"], ["after 1am and before 8am every weekday"])
        self.assertEqual((resumo["automerge"], resumo["pr_hourly_limit"], resumo["pr_concurrent_limit"]), (False, 15, 15))
        self.assertEqual(resumo["regras"], 13)

    def test_renovate_invalido_vira_aviso(self) -> None:
        escrever(self.raiz, "renovate.json", "{ isto não é json")
        saida = self.rodar()
        self.assertIsNone(saida["raiz_arquivos"]["renovate"]["resumo"])
        self.assertTrue(any(a.startswith("renovate.json:") for a in saida["avisos"]))

    def test_cli_rejeita_pasta_inexistente(self) -> None:
        r = subprocess.run([sys.executable, "-I", str(Path(inventario.__file__)), str(self.raiz / "nao-existe")],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 2)


if __name__ == "__main__":
    unittest.main()
