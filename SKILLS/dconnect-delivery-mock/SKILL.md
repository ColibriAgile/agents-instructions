---
name: dconnect-delivery-mock
description: "DeliveryMock architecture and local workflow guidance. Use when changing or exercising the modern Blazor/OpenDelivery/iFood mock or distinguishing it from WebDeliveryMock. Don't use for DConnect production connectors or generic ASP.NET guidance."
disable-model-invocation: true
---

# DeliveryMock

## Select the mock

Use `DeliveryMock/` for the current ASP.NET Core and Blazor Server mock. Use `WebDeliveryMock/` for the separate legacy MVC mock with JSON orders, in-memory queues, SignalR, and `IViaAPIClient`. Keep the two implementations separate when locating controllers, services, pages, or test fixtures.

Done when the requested behavior is mapped to the intended mock directory.

## Follow the modern flow

Inspect `DeliveryMock/Program.cs` for service registration, then trace the feature through the relevant area:

- `Pages`, `Shared`, and `Components`: Blazor UI;
- `Controllers/OpenDelivery` and `Controllers/Ifood`: provider APIs;
- `Services/OpenDelivery`, `Services/Ifood`, `Services/Stores`, and `Services/Traffic`: application services;
- `Infrastructure/Persistence/Sqlite`: local store catalog persistence;
- `Services/ViaAPI/IDConnect.cs`: Refit calls to the DConnect API.

OpenDelivery and iFood order state is held in `ConcurrentDictionary` services and events are emitted through the provider event services. Store metadata is persisted in `Data/deliverymock-stores.db` with `mock_store`, `mock_store_auth`, and `mock_store_metadata` tables.

Done when the change preserves the existing provider service boundary and the correct state store.

## Exercise the application

Build the current mock from the repository root:

```powershell
dotnet build "DeliveryMock/DeliveryMock.csproj"
```

Use the `DeliveryMock` pages and controllers for OpenDelivery, iFood, ViaAPI, and traffic capture. `PedidoGenerator` can resolve a Colibri SQL Server connection before generating fake orders; the integration path then serializes the order and calls DConnect through `Services/ViaAPI/IDConnect.cs`.

Done when the mock builds and the selected provider endpoint or page reaches its registered service.

## Preserve integration boundaries

Keep DConnect calls behind `DeliveryMock/Services/ViaAPI/IDConnect.cs`. Keep request capture in `Middleware/HttpTrafficCaptureMiddleware.cs`. Keep SQLite initialization in `Infrastructure/Persistence/Sqlite/SqliteDatabaseInitializer.cs`. Provider-specific models and services belong under their corresponding `Ifood` or `OpenDelivery` folders.

Done when the change leaves Refit, traffic capture, SQLite initialization, and provider-specific services in their existing boundaries.
