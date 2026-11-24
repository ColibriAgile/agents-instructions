---
name: dconnect-release-publish
description: "DConnect CI, runtime, Docker, and release-publish guidance. Use when changing build workflows, publishing DConnect (with the Dashboard SPA and Plugin.DConnect), or mocks, or diagnosing packaging prerequisites. Don't use for ordinary project compilation or application feature design."
disable-model-invocation: true
---

# DConnect Release And Publish

## Match the workflow

Read the target workflow before changing a release path:

- `.github/workflows/build.yml`: `DConnect` and `ComandosDConnect` with `win-x64` and single-file publishing, `Plugin.DConnect` with `win-x86`;
- `.github/workflows/build-mock.yml`: `DeliveryMock` with `win-x64`, single-file publishing;
- `.github/workflows/deploy.yml`: manual S3 deployment of an existing package, with no checkout or build.

The build workflows read `_build/<product>/versao.ini`, create `temp`, package, and output folders, then call the external `ColibriAgile/build-tools` publish and release actions. DConnect and DeliveryMock also pass `_scripts` to the release action.

The DConnect publish also compiles the SPA in `DConnect/ClientApp` (2 Vite entries: the Admin, served at `/admin`, and the operations panel, served at the root `/`, from `spa/index.html`) (`npm ci` and `npm run build`, MSBuild targets `CompilarSpa` and `PublicarSpa` in `DConnect/DConnect.csproj`) and places `dist/` in `wwwroot/spa`, outside the single file; `dconnect.iss` deletes the obsolete `wwwroot\dashboard` folder on install. It needs Node on the runner: `build.yml` runs `actions/setup-node` (Node 24) before the publish, and `testes.yml` tests and builds the SPA in its own `spa` job. The DConnect release passes the `_build/DConnect` folder as `iss-file`, so the action compiles 2 installers into one package: `dconnect.iss` (`Colibri_DConnect_*.exe`, server only: the service and every subfolder of the publish, `wwwroot/spa` included) and `dconnect_plugin.iss` (`Colibri_DConnectPlugin_*.exe`, every station: `Plugin.DConnect` in `plugins-manager\plugins\dconnect` and the print templates in `plugins\dconnect\templates`). `_build/DConnect/pacote/manifesto.server` declares both (`server` and `shared`), depends on `Plugin_Manager`, and creates the Launcher button that opens `http://%servidor-master%:%porta-dconnect%/`.

Done when the product, runtime, version file, package folder, and external release action are all identified.

## Preserve runtime requirements

Keep `Plugin.DConnect/Plugin.DConnect.csproj` on x86 and publish it with `--runtime win-x86`. Keep the other products on the runtime selected by their workflow; treat the workflow as the active release input and verify the resulting artifact.

Done when the generated artifact's runtime matches the consuming product and workflow.

## Validate Docker context

Build Dockerfiles with the repository root as context because they copy project paths from that root. `DConnect/Dockerfile` restores, builds, and publishes `DConnect/DConnect.csproj` with .NET 11 SDK/runtime images and exposes ports 80 and 443. The root `Dockerfile` targets `WebDeliveryMock`, exposes 5051, and expects `_ncr-library`, which is absent from the current checkout while the project references `_lib`.

Treat a root Docker build failure involving `_ncr-library` as a missing checkout dependency. The DConnect Dockerfile is the reproducible container path in this repository.

Done when the build context contains every `COPY` source or the missing external dependency is explicitly supplied.

## Account for external packaging inputs

The Inno Setup files under `_build/DConnect` and `_build/DeliveryMock` reference `_lib-inno` and, for `dconnect.iss`, `comum` outside this repository (NSSM). Their release action and `@master` external implementations are not defined locally. Validate those inputs on the self-hosted `[self-hosted, colibri]` runner instead of inferring local `iscc` or publish behavior from absent scripts.

Done when packaging dependencies and the external action boundary are recorded alongside the change.
