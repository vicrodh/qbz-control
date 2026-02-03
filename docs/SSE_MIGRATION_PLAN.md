# Plan: Reemplazar Polling con SSE

## Resumen
Eliminar el polling de 1.5s a `/api/now-playing` reemplazándolo con Server-Sent Events (SSE).

## Arquitectura Anterior
```
PWA ──polling cada 1.5s──> /api/now-playing (SPAM)
PWA <────WebSocket────── /api/ws (eventos en tiempo real)
```

Ambos sistemas corrían en paralelo. El WS ya usaba broadcast channel.

## Arquitectura Actual (Implementada)
```
PWA <────SSE────── /api/events (eventos en tiempo real, reconexión automática)
```

Un solo mecanismo, sin polling.

---

## Fase 1: Backend - Endpoint SSE (Completado)

**Archivo:** `/qbz-nix/src-tauri/src/api_server/mod.rs`

### 1.1 Imports agregados
```rust
use axum::response::sse::{Event, Sse};
use futures_util::stream::Stream;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
```

### 1.2 Handler SSE implementado
```rust
async fn sse_handler(
    State(ctx): State<ApiContext>,
) -> Sse<impl Stream<Item = Result<Event, std::convert::Infallible>>> {
    let rx = ctx.playback_tx.subscribe();
    let stream = BroadcastStream::new(rx)
        .filter_map(|result| {
            match result {
                Ok(event) => {
                    let json = serde_json::to_string(&event).ok()?;
                    Some(Ok(Event::default().data(json)))
                }
                Err(_) => None, // Skip lagged messages
            }
        });

    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping")
    )
}
```

### 1.3 Ruta agregada
```rust
.route("/api/events", get(sse_handler))
```

### 1.4 Dependencia agregada en Cargo.toml
```toml
tokio-stream = { version = "0.1", features = ["sync"] }
```

---

## Fase 2: PWA - EventSource (Completado)

**Archivo:** `/qbz-control-web/src/App.tsx`

### 2.1 Eliminado
- `refreshTimer` ref (polling)
- `startPolling` función
- `setInterval` de 1500ms
- WebSocket connection
- `buildWsUrl` import y función

### 2.2 Implementado EventSource
```typescript
useEffect(() => {
  if (!connected || !config.baseUrl || !config.token) {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    return;
  }

  const url = `${config.baseUrl}/api/events?token=${encodeURIComponent(config.token)}`;
  const es = new EventSource(url);
  eventSourceRef.current = es;

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setPlayback({ ... });
    // Track change detection -> refreshNowPlaying + refreshQueue
  };

  es.onerror = () => {
    // EventSource reconecta automáticamente
  };

  return () => { es.close(); };
}, [connected, config.baseUrl, config.token, refreshNowPlaying, refreshQueue]);
```

### 2.3 Mantenido
- `refreshNowPlaying` para metadata completa del track
- `refreshQueue` para cambios de track

---

## Fase 3: Cleanup (Completado)

### 3.1 Backend
- `/api/ws` mantenido por compatibilidad (puede deprecarse después)

### 3.2 PWA
- `buildWsUrl` eliminado de `api.ts`
- Imports no usados eliminados

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `qbz-nix/src-tauri/src/api_server/mod.rs` | + SSE handler y ruta |
| `qbz-nix/src-tauri/Cargo.toml` | + tokio-stream dependency |
| `qbz-control-web/src/App.tsx` | - polling, - WebSocket, + EventSource |
| `qbz-control-web/src/lib/api.ts` | - buildWsUrl |

---

## Verificación

1. **Build backend:** `cargo build` en qbz-nix
2. **Build PWA:** `npm run build` en qbz-control-web
3. **Test manual:**
   - Abrir PWA, verificar conexión SSE en Network tab
   - Play/pause en desktop -> PWA actualiza inmediatamente
   - Cambiar track -> PWA muestra nuevo track
   - Verificar NO hay polling a `/api/now-playing` (excepto refresh manual)
4. **Test reconexión:**
   - Reiniciar QBZ -> PWA reconecta automáticamente

---

## Beneficios Esperados

- **Antes:** ~40 requests/minuto (polling 1.5s)
- **Después:** ~0 requests/minuto (solo eventos reales)
- Reconexión automática nativa
- Menor latencia en actualizaciones
- Código más simple

---

## Status

**IMPLEMENTADO** - 2026-02-03
