# Guía de Implementación: Suscripciones con Culqi API para SaaS

> Documentación técnica para que un agente implemente el flujo completo de suscripciones recurrentes usando la API v2.0 de Culqi.

---

## Índice

1. [Resumen General](#resumen-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Arquitectura del Flujo](#arquitectura-del-flujo)
4. [Autenticación](#autenticación)
5. [Paso 1 — Tokenizar Tarjeta (Frontend)](#paso-1--tokenizar-tarjeta-frontend)
6. [Paso 2 — Crear Cliente](#paso-2--crear-cliente)
7. [Paso 3 — Crear Tarjeta](#paso-3--crear-tarjeta)
8. [Paso 4 — Crear Plan](#paso-4--crear-plan)
9. [Paso 5 — Crear Suscripción](#paso-5--crear-suscripción)
10. [Paso 6 — Webhooks (Notificaciones Asíncronas)](#paso-6--webhooks-notificaciones-asíncronas)
11. [Gestión de Suscripciones](#gestión-de-suscripciones)
12. [Tarjetas de Prueba](#tarjetas-de-prueba)
13. [SDKs Disponibles](#sdks-disponibles)
14. [Manejo de Errores](#manejo-de-errores)
15. [Consideraciones para SaaS](#consideraciones-para-saas)
16. [Referencias](#referencias)

---

## Resumen General

Culqi es una pasarela de pagos peruana (respaldada por Credicorp) que permite cobros con tarjetas de crédito/débito, Yape, PagoEfectivo y billeteras móviles. El módulo de **Suscripciones** permite definir planes de cobro recurrente a los que los clientes se suscriben registrando su tarjeta.

El flujo de suscripciones consta de estas entidades principales:

| Entidad        | Descripción                                                       | Prefijo ID              |
|----------------|-------------------------------------------------------------------|-------------------------|
| **Token**      | Representación segura de los datos de tarjeta                     | `tkn_test_` / `tkn_live_` |
| **Cliente**    | Datos del cliente (nombre, email, dirección)                      | `cus_test_` / `cus_live_` |
| **Tarjeta**    | Asociación token + cliente para cobros futuros                    | `crd_test_` / `crd_live_` |
| **Plan**       | Define monto, frecuencia y moneda del cobro recurrente            | `pln_test_` / `pln_live_` |
| **Suscripción**| Asociación tarjeta + plan que activa el cobro automático          | `sxn_test_` / `sxn_live_` |

**Ciclo de vida de una suscripción:**
- `active` → La suscripción está activa y se cobran los periodos.
- `canceled` → Cancelada manualmente, por API, o automáticamente al superar reintentos fallidos.

> **IMPORTANTE:** Una suscripción cancelada no se puede reactivar. El cliente debe crear una nueva suscripción con un medio de pago válido.

---

## Requisitos Previos

1. **Cuenta Culqi** — Afiliarse en [https://culqi.com](https://culqi.com).
2. **Llaves de API** — Obtenerlas desde CulqiPanel > Desarrollo > API Keys:
   - `pk_test_XXXXXXXX` — Llave pública (frontend, tokenización).
   - `sk_test_XXXXXXXX` — Llave privada (backend, operaciones seguras).
3. **Llaves RSA (opcional)** — Para encriptar payloads: CulqiPanel > Desarrollo > RSA Keys.
4. **Webhook URL** — Endpoint HTTPS en tu servidor para recibir notificaciones de Culqi.
5. **Cumplimiento PCI DSS 3.2** — Si interactúas directamente con el API de Token desde backend, debes llenar el formulario SAQ-D y enviarlo a riesgos Culqi. Usar Culqi Checkout o CulqiJS evita este requisito.

---

## Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                                                                  │
│  1. Cliente ingresa datos de tarjeta                             │
│  2. Culqi Checkout / CulqiJS tokeniza → obtiene token_id        │
│  3. Envía token_id al backend                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│                                                                  │
│  4. Crear Cliente      → POST /v2/customers                      │
│  5. Crear Tarjeta      → POST /v2/cards                          │
│  6. Crear Plan (1 vez) → POST /v2/plans                          │
│  7. Crear Suscripción  → POST /v2/subscriptions                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CULQI (Batch diario)                         │
│                                                                  │
│  8. Procesa suscripciones del día                                │
│  9. Cobra a las tarjetas según el plan                           │
│ 10. Notifica resultados via Webhook                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Autenticación

**Base URL:** `https://api.culqi.com`

Todas las peticiones al backend de Culqi requieren la llave privada en el header:

```
Authorization: Bearer sk_test_XXXXXXXXXXXXXXXX
Content-Type: application/json
```

Para tokenización (frontend), se usa la llave pública `pk_test_XXXXXXXXXXXXXXXX`.

**Formato de llaves:**
- Pruebas: `pk_test_*` / `sk_test_*`
- Producción: `pk_live_*` / `sk_live_*`

---

## Paso 1 — Tokenizar Tarjeta (Frontend)

La tokenización captura los datos sensibles de la tarjeta de forma segura sin que toquen tu servidor.

**Opción recomendada: Culqi Custom Checkout**

```html
<script>
  const settings = {
    title: "Mi SaaS",
    currency: "PEN",
    amount: 0  // amount: 0 para solo capturar tarjeta (suscripciones)
  };

  const config = {
    settings
    // ...otras opciones de personalización
  };

  const publicKey = "pk_test_XXXXXXXXXXXXXXXX";
  const Culqi = new CulqiCheckout(publicKey, config);
</script>
```

> Usar `amount: 0` activa el modo de solo captura de tarjeta, ideal para suscripciones.

**Resultado:** Se obtiene un `token.id` (ej: `tkn_test_XXXXXXXXXXXXXXXX`) que se envía al backend.

**Documentación del Checkout:** [https://docs.culqi.com/es/documentacion/checkout/checkout-custom](https://docs.culqi.com/es/documentacion/checkout/checkout-custom)

---

## Paso 2 — Crear Cliente

Registra la información del usuario de tu SaaS en Culqi.

**Endpoint:** `POST https://api.culqi.com/v2/customers`

**Headers:**
```
Authorization: Bearer sk_test_XXXXXXXXXXXXXXXX
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Richard",
  "last_name": "Hendricks",
  "email": "richard@piedpiper.com",
  "address": "Av. Javier Prado 1234",
  "address_city": "Lima",
  "country_code": "PE",
  "phone_number": "999888777"
}
```

**Response (éxito):**
```json
{
  "object": "customer",
  "id": "cus_test_Lz6Yfsm7QqCPIECW",
  "creation_date": 1487041774773,
  "email": "richard@piedpiper.com",
  "first_name": "Richard",
  "last_name": "Hendricks",
  "address": "Av. Javier Prado 1234",
  "address_city": "Lima",
  "country_code": "PE",
  "phone_number": "999888777"
}
```

**Endpoints disponibles para Clientes:**

| Acción   | Método | URL                              |
|----------|--------|----------------------------------|
| Crear    | POST   | `/v2/customers`                  |
| Consultar| GET    | `/v2/customers/{id}`             |
| Listar   | GET    | `/v2/customers`                  |
| Actualizar| PATCH | `/v2/customers/{id}`             |
| Eliminar | DELETE | `/v2/customers/{id}`             |

**API Ref:** [https://apidocs.culqi.com/#tag/Clientes](https://apidocs.culqi.com/#tag/Clientes)

---

## Paso 3 — Crear Tarjeta

Asocia el token (datos de tarjeta) con el cliente creado.

**Endpoint:** `POST https://api.culqi.com/v2/cards`

**Request Body:**
```json
{
  "customer_id": "cus_test_Lz6Yfsm7QqCPIECW",
  "token_id": "tkn_test_XXXXXXXXXXXXXXXX"
}
```

**Response (éxito):**
```json
{
  "object": "card",
  "id": "crd_test_XXXXXXXXXXXXXXXX",
  "creation_date": 1487041784000,
  "customer_id": "cus_test_Lz6Yfsm7QqCPIECW",
  "source": {
    "card_number": "411111******1111",
    "iin": {
      "card_brand": "Visa",
      "card_type": "credito"
    }
  }
}
```

**Endpoints disponibles para Tarjetas:**

| Acción   | Método | URL                        |
|----------|--------|----------------------------|
| Crear    | POST   | `/v2/cards`                |
| Consultar| GET    | `/v2/cards/{id}`           |
| Listar   | GET    | `/v2/cards`                |
| Actualizar| PATCH | `/v2/cards/{id}`           |
| Eliminar | DELETE | `/v2/cards/{id}`           |

**API Ref:** [https://apidocs.culqi.com/#tag/Tarjetas](https://apidocs.culqi.com/#tag/Tarjetas)

---

## Paso 4 — Crear Plan

Define la frecuencia y monto del cobro recurrente. Los planes se crean **una sola vez** y se reutilizan para múltiples suscriptores.

**Endpoint:** `POST https://api.culqi.com/v2/plans`

**Request Body:**
```json
{
  "name": "Plan Premium Mensual",
  "short_name": "premium-mensual",
  "description": "Acceso completo a todas las funcionalidades",
  "amount": 4900,
  "currency": "PEN",
  "interval_unit_time": 1,
  "interval_count": 1,
  "initial_cycles": {
    "count": 0,
    "has_initial_charge": false,
    "amount": 0,
    "interval_unit_time": 1
  },
  "metadata": {
    "plan_tier": "premium"
  }
}
```

**Campos clave:**

| Campo                | Tipo    | Descripción                                                           |
|----------------------|---------|-----------------------------------------------------------------------|
| `name`               | string  | Nombre visible del plan                                               |
| `short_name`         | string  | Slug identificador (sin espacios)                                     |
| `amount`             | integer | Monto en la menor unidad de la moneda (4900 = S/ 49.00)              |
| `currency`           | string  | Moneda: `"PEN"` (soles) o `"USD"` (dólares)                          |
| `interval_unit_time` | integer | Unidad de tiempo: `1` = días, `2` = semanas, `3` = meses, `4` = años |
| `interval_count`     | integer | Cada cuántas unidades se cobra (1 = cada mes si unit_time es 3)       |
| `initial_cycles`     | object  | Configuración de ciclos iniciales/trial                               |

**Ejemplos de configuración de planes para SaaS:**

```
Plan Mensual:    interval_unit_time: 3, interval_count: 1, amount: 4900
Plan Trimestral: interval_unit_time: 3, interval_count: 3, amount: 12900
Plan Anual:      interval_unit_time: 4, interval_count: 1, amount: 49900
```

**Response (éxito):**
```json
{
  "id": "pln_test_XXXXXXXXXXXXXXXX",
  "interval_unit_time": 1,
  "interval_count": 1,
  "amount": 4900,
  "name": "Plan Premium Mensual",
  "description": "Acceso completo a todas las funcionalidades",
  "short_name": "premium-mensual",
  "currency": "PEN",
  "initial_cycles": {
    "count": 0,
    "has_initial_charge": false,
    "amount": 0,
    "interval_unit_time": 1
  },
  "metadata": {
    "plan_tier": "premium"
  },
  "total_subscriptions": 0,
  "status": 1,
  "creation_date": 1556569427000
}
```

**Endpoints disponibles para Planes:**

| Acción    | Método | URL                           |
|-----------|--------|-------------------------------|
| Crear     | POST   | `/v2/plans`                   |
| Consultar | GET    | `/v2/plans/{id}`              |
| Listar    | GET    | `/v2/plans`                   |
| Actualizar| PATCH  | `/v2/plans/{id}`              |
| Eliminar  | DELETE | `/v2/plans/{id}`              |

**API Ref:** [https://apidocs.culqi.com/#tag/Planes](https://apidocs.culqi.com/#tag/Planes)

---

## Paso 5 — Crear Suscripción

Asocia una tarjeta (cliente) con un plan para activar el cobro automático.

**Endpoint:** `POST https://api.culqi.com/v2/subscriptions`

**Request Body:**
```json
{
  "card_id": "crd_test_XXXXXXXXXXXXXXXX",
  "plan_id": "pln_test_XXXXXXXXXXXXXXXX",
  "tyc": true,
  "metadata": {
    "user_id": "usr_12345",
    "saas_plan": "premium"
  }
}
```

| Campo     | Tipo    | Descripción                                            |
|-----------|---------|--------------------------------------------------------|
| `card_id` | string  | ID de la tarjeta creada en el Paso 3                   |
| `plan_id` | string  | ID del plan creado en el Paso 4                        |
| `tyc`     | boolean | Aceptación de Términos y Condiciones (siempre `true`)  |
| `metadata`| object  | Campos personalizados para tu lógica de negocio        |

**Response (éxito):**
```json
{
  "id": "sxn_test_XXXXXXXXXXXXXXXX",
  "status": 3,
  "creation_date": 1656201600,
  "next_billing_date": 1656201601,
  "current_period": 1,
  "trial_start": 1656201600,
  "trial_end": 16459770801,
  "active_card": "crd_test_XXXXXXXXXXXXXXXX",
  "plan": {
    "plan_id": "pln_test_XXXXXXXXXXXXXXXX",
    "name": "Plan Premium Mensual",
    "amount": 4900,
    "current": "PEN",
    "interval_unit_time": 1
  },
  "periods": {
    "period": 0,
    "status": 1,
    "charges": {
      "card_id": "crd_test_XXXXXXXXXXXXXXXX",
      "card_number": "XXXXXXXX****XXXX",
      "card_brand": "Visa",
      "charge_id": "chr_live_XXXXXXXXXXXXXXXX",
      "charger_status": 1,
      "charge_day": 1656201601,
      "error": "",
      "amount": 4900,
      "currency": "PEN"
    }
  },
  "customer": {
    "first_name": "Richard",
    "last_name": "Hendricks",
    "email": "richard@piedpiper.com"
  }
}
```

**Endpoints disponibles para Suscripciones:**

| Acción    | Método | URL                                |
|-----------|--------|------------------------------------|
| Crear     | POST   | `/v2/subscriptions`                |
| Consultar | GET    | `/v2/subscriptions/{id}`           |
| Listar    | GET    | `/v2/subscriptions`                |
| Actualizar| PATCH  | `/v2/subscriptions/{id}`           |
| Cancelar  | DELETE | `/v2/subscriptions/{id}`           |

**API Ref:** [https://apidocs.culqi.com/#tag/Suscripciones](https://apidocs.culqi.com/#tag/Suscripciones)

---

## Paso 6 — Webhooks (Notificaciones Asíncronas)

Culqi procesa los cobros de suscripciones de forma asíncrona mediante un batch diario. Tu sistema **debe** implementar webhooks para recibir notificaciones sobre el estado de cada cobro.

**Configuración:**
1. Ve a CulqiPanel > Eventos > Webhooks.
2. Registra tu URL (debe ser HTTPS): `https://tu-saas.com/api/webhooks/culqi`
3. Selecciona los eventos a escuchar.

**Eventos relevantes para suscripciones:**

| Evento                          | Descripción                                      |
|---------------------------------|--------------------------------------------------|
| `subscription.created`          | Nueva suscripción creada                         |
| `subscription.canceled`         | Suscripción cancelada                            |
| `subscription.charge.succeeded` | Cobro recurrente exitoso                         |
| `subscription.charge.failed`    | Cobro recurrente fallido                         |

**Ejemplo de endpoint webhook (Node.js/Express):**
```javascript
app.post('/api/webhooks/culqi', (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'subscription.charge.succeeded':
      // Activar/renovar acceso del usuario en tu SaaS
      const subscriptionId = event.data.id;
      // Actualizar estado en tu base de datos
      break;

    case 'subscription.charge.failed':
      // Notificar al usuario que el cobro falló
      // Mostrar banner para actualizar método de pago
      break;

    case 'subscription.canceled':
      // Revocar acceso o activar periodo de gracia
      break;
  }

  res.status(200).json({ received: true });
});
```

> **IMPORTANTE:** Los webhooks son el mecanismo principal para sincronizar el estado de las suscripciones entre Culqi y tu SaaS. No depender solo de la respuesta de creación.

**Documentación Webhooks:** [https://docs.culqi.com/es/documentacion/pagos-online/webhooks](https://docs.culqi.com/es/documentacion/pagos-online/webhooks)

---

## Gestión de Suscripciones

### Cancelar una suscripción

La cancelación es inmediata e irreversible. No se generarán más cargos futuros.

```
DELETE https://api.culqi.com/v2/subscriptions/{subscription_id}
Authorization: Bearer sk_test_XXXXXXXXXXXXXXXX
```

**Razones comunes de cancelación:**
- El cliente la solicita.
- El cliente quiere cambiar de plan (cancelar actual + crear nueva).
- El cliente necesita cambiar medio de pago.
- Cancelación automática por exceder reintentos de cobro fallido.

### Cambiar de plan (upgrade/downgrade)

Culqi no tiene un endpoint nativo de cambio de plan. La estrategia recomendada es:

1. Cancelar la suscripción actual.
2. Crear una nueva suscripción con el nuevo plan y la misma tarjeta.
3. Manejar el prorrateo en tu lógica de negocio.

### Cambiar método de pago

1. Crear un nuevo token con los datos de la nueva tarjeta.
2. Crear una nueva tarjeta asociada al mismo cliente.
3. Cancelar la suscripción actual.
4. Crear una nueva suscripción con la nueva tarjeta y el mismo plan.

---

## Tarjetas de Prueba

Usa estas tarjetas en el ambiente de integración (`pk_test_` / `sk_test_`):

| Tarjeta              | Número           | CVV | Vencimiento | Resultado         |
|----------------------|------------------|-----|-------------|-------------------|
| Visa (aprobada)      | 4111111111111111 | 123 | 09/2025     | Cargo exitoso     |
| Mastercard (aprobada)| 5111111111111118 | 039 | 06/2025     | Cargo exitoso     |
| Visa (denegada)      | 4000000000000002 | 123 | 09/2025     | Cargo denegado    |

> **Nota:** Verifica las tarjetas de prueba actualizadas en: [https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba](https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba)

---

## SDKs Disponibles

Culqi ofrece SDKs oficiales para agilizar la integración backend:

| Lenguaje   | Paquete / Repo                                          | Versión API |
|------------|---------------------------------------------------------|-------------|
| **Python** | `pip install culqi-python-oficial`                      | v2.0        |
| **PHP**    | [culqi/culqi-php](https://github.com/culqi/culqi-php)  | v2.0        |
| **Java**   | [culqi/culqi-java](https://github.com/culqi/culqi-java)| v2.0        |
| **.NET**   | [culqi/culqi-net](https://github.com/culqi/culqi-net)  | v2.0        |
| **Go**     | [culqi/culqi-go](https://github.com/culqi/culqi-go)    | v2.0        |
| **Node.js**| `npm install culqi-node` (comunidad)                    | v2.0        |

**Ejemplo con Python SDK:**

```python
from culqi2.client import Culqi

culqi = Culqi("pk_test_XXXXXXXX", "sk_test_XXXXXXXX")

# Crear cliente
customer = culqi.customer.create(data={
    "first_name": "Richard",
    "last_name": "Hendricks",
    "email": "richard@piedpiper.com",
    "address": "Av. Javier Prado 1234",
    "address_city": "Lima",
    "country_code": "PE",
    "phone_number": "999888777"
})

# Crear tarjeta
card = culqi.card.create(data={
    "customer_id": customer["id"],
    "token_id": "tkn_test_XXXXXXXX"
})

# Crear plan (una sola vez)
plan = culqi.plan.create(data={
    "name": "Plan Premium",
    "short_name": "premium",
    "description": "Plan mensual premium",
    "amount": 4900,
    "currency": "PEN",
    "interval_unit_time": 3,
    "interval_count": 1,
    "initial_cycles": {
        "count": 0,
        "has_initial_charge": False,
        "amount": 0,
        "interval_unit_time": 1
    }
})

# Crear suscripción
subscription = culqi.subscription.create(data={
    "card_id": card["id"],
    "plan_id": plan["id"],
    "tyc": True
})
```

---

## Manejo de Errores

Las respuestas de error de Culqi siguen un formato estándar:

```json
{
  "object": "error",
  "type": "parameter_error",
  "merchant_message": "El parámetro email es inválido.",
  "user_message": "Ocurrió un error con los datos ingresados.",
  "param": "email"
}
```

**Códigos HTTP comunes:**

| Código | Significado                                                    |
|--------|----------------------------------------------------------------|
| 200    | Operación exitosa                                              |
| 201    | Recurso creado exitosamente                                    |
| 400    | Parámetro inválido o faltante                                  |
| 401    | Llave de API inválida o faltante                               |
| 404    | Recurso no encontrado                                          |
| 422    | No se pudo procesar (ej: tarjeta rechazada)                    |
| 429    | Demasiadas peticiones (rate limit)                             |
| 500    | Error interno del servidor de Culqi                            |

---

## Consideraciones para SaaS

### Modelo de datos sugerido

Tu base de datos debería mapear las entidades de Culqi:

```
users
├── culqi_customer_id    (cus_test_XXX)
├── culqi_card_id        (crd_test_XXX)  → tarjeta activa
├── culqi_subscription_id (sxn_test_XXX) → suscripción activa
├── plan_tier            (free, basic, premium)
├── subscription_status  (active, canceled, past_due)
└── subscription_end_date

plans (tabla local de referencia)
├── name
├── culqi_plan_id        (pln_test_XXX)
├── price
├── interval
└── features (JSON)
```

### Flujo recomendado para SaaS

1. **Registro:** El usuario se registra con plan gratuito (sin Culqi).
2. **Upgrade:** El usuario selecciona un plan pago → se muestra Culqi Checkout → se ejecuta el flujo completo de suscripción.
3. **Cobro recurrente:** Culqi cobra automáticamente cada periodo → webhook actualiza tu BD.
4. **Fallo de cobro:** Webhook notifica fallo → muestra banner al usuario → periodo de gracia configurable.
5. **Cancelación:** El usuario cancela → se ejecuta DELETE suscripción → se mantiene acceso hasta fin del periodo pagado (lógica tuya).
6. **Cambio de plan:** Cancelar suscripción actual + crear nueva con el nuevo plan.

### Seguridad

- **Nunca** almacenar datos de tarjeta en tu servidor. Siempre usar tokens.
- Usar Culqi Checkout o CulqiJS para cumplir PCI DSS 3.2 sin complicaciones.
- Las llaves `sk_*` (privadas) solo deben estar en el backend, **nunca en el frontend**.
- Validar los webhooks verificando que provienen de Culqi (IPs permitidas o firma).
- Usar variables de entorno para las llaves, nunca hardcodearlas.

### Paso a producción

1. Completar pruebas con llaves `*_test_*`.
2. Obtener llaves de producción desde CulqiPanel.
3. Reemplazar `pk_test_` → `pk_live_` y `sk_test_` → `sk_live_`.
4. Verificar que el webhook de producción esté configurado.
5. Realizar una transacción real de prueba con monto mínimo.

---

## Referencias

| Recurso                    | URL                                                                                                      |
|----------------------------|----------------------------------------------------------------------------------------------------------|
| API Docs (Referencia)      | [https://apidocs.culqi.com/](https://apidocs.culqi.com/)                                                |
| Documentación General      | [https://docs.culqi.com/](https://docs.culqi.com/)                                                      |
| Suscripciones - Resumen    | [https://docs.culqi.com/es/documentacion/pagos-online/recurrencia/suscripciones/resumen/](https://docs.culqi.com/es/documentacion/pagos-online/recurrencia/suscripciones/resumen/) |
| Planes                     | [https://docs.culqi.com/es/documentacion/pagos-online/recurrencia/suscripciones/plan/](https://docs.culqi.com/es/documentacion/pagos-online/recurrencia/suscripciones/plan/) |
| API Suscripciones          | [https://apidocs.culqi.com/#tag/Suscripciones](https://apidocs.culqi.com/#tag/Suscripciones)            |
| API Planes                 | [https://apidocs.culqi.com/#tag/Planes](https://apidocs.culqi.com/#tag/Planes)                          |
| API Clientes               | [https://apidocs.culqi.com/#tag/Clientes](https://apidocs.culqi.com/#tag/Clientes)                      |
| API Tarjetas               | [https://apidocs.culqi.com/#tag/Tarjetas](https://apidocs.culqi.com/#tag/Tarjetas)                      |
| API Tokens                 | [https://apidocs.culqi.com/#tag/Tokens](https://apidocs.culqi.com/#tag/Tokens)                          |
| Webhooks                   | [https://docs.culqi.com/es/documentacion/pagos-online/webhooks](https://docs.culqi.com/es/documentacion/pagos-online/webhooks) |
| Checkout Custom            | [https://docs.culqi.com/es/documentacion/checkout/checkout-custom](https://docs.culqi.com/es/documentacion/checkout/checkout-custom) |
| Tarjetas de Prueba         | [https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba](https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba) |
| SDKs (GitHub)              | [https://github.com/culqi](https://github.com/culqi)                                                    |
| Soporte                    | Teléfono: (01) 643 1050 / 946365851                                                                     |

---

*Documento generado para implementación de suscripciones Culqi en SaaS. Fecha: Mayo 2026.*
