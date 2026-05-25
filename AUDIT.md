# Auditoría Técnica — SERSI-AI (j-ai)

**Fecha:** 2026-05-21
**Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript 5 · Prisma 5 (PostgreSQL) · Clerk 4 · Tailwind 3.4 + shadcn/ui (Radix) · Stripe + MercadoPago · Pusher · OpenAI · Uploadcare · React Hook Form + Zod
**Objetivo:** documentar las decisiones arquitectónicas que hacen al producto consistente y rápido en producción, para replicarlas en otros SaaS — y registrar las áreas a corregir.

---

## 1. Resumen ejecutivo

El proyecto aplica **muy bien** un puñado de decisiones que tienen impacto desproporcionado en la sensación de velocidad y consistencia:

1. **Route Groups + layouts anidados en App Router** → el chrome (sidebar, providers, fetch de dominios) se monta **una sola vez** para todo el dashboard y se preserva entre navegaciones.
2. **Server Components por defecto + Server Actions** → las páginas hacen el fetch en el servidor, sin spinner en la primera carga; los formularios mutan vía RPC tipado sin endpoints REST manuales.
3. **`select` exhaustivo en Prisma** → cada query trae **solo los campos que necesita**, lo que reduce payload, parse-time y consumo de memoria del cliente Prisma.
4. **Form layer unificado**: `react-hook-form` + `zodResolver` + un `<FormGenerator />` reutilizable + custom hook por feature → cero re-renders innecesarios y validación tipada extremo a extremo.
5. **Animaciones declarativas en Tailwind**, no en JS → el sidebar se abre/cierra con `animate-open-sidebar` (keyframe puro) en GPU.

A continuación se detalla qué patrón replicar, en qué archivo está, y por qué funciona.

---

## 2. Arquitectura y estructura de carpetas

### 2.1. Layout físico

```
src/
├── actions/        # Server Actions (RPC). Una carpeta por dominio.
│   ├── auth/
│   ├── bot/
│   ├── conversation/
│   ├── dashboard/
│   ├── mail/
│   ├── mercadoPago/
│   ├── payments/
│   ├── settings/
│   ├── stripe/
│   └── ...
├── app/            # App Router. Route Groups para layouts compartidos.
│   ├── (dashboard)/        # → layout con SideBar + auth
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── conversation/page.tsx
│   │   ├── settings/[domain]/page.tsx
│   │   └── ...
│   ├── auth/               # → layout splash + form (sign-in/sign-up)
│   ├── portal/             # → layout cliente externo
│   ├── chatbot/            # → bot embebible (sin auth)
│   ├── blogs/[id]/
│   ├── api/stripe/connect/route.ts
│   ├── layout.tsx          # ClerkProvider + ThemeProvider + Toaster
│   └── page.tsx            # landing
├── components/
│   ├── ui/                 # primitives shadcn (button, dialog, ...)
│   ├── forms/              # form components por feature
│   │   ├── form-generator/ # ★ generador único de inputs
│   │   ├── sign-up/
│   │   ├── settings/
│   │   └── portal/
│   ├── sidebar/            # sidebar splittada en max/min/menu-item
│   ├── conversations/
│   ├── dashboard/
│   ├── settings/
│   └── ...
├── hooks/                  # un hook por feature/use-case
│   ├── billling/use-billing.ts
│   ├── chatbot/use-chatbot.ts
│   ├── settings/use-settings.ts
│   ├── sidebar/use-domain.ts
│   └── sign-up/use-sign-up.ts
├── schemas/                # Zod schemas + tipos TS
├── context/                # React Providers (theme, chat, sidebar logic)
├── constants/              # datos estáticos (menu, planes, slots)
├── icons/                  # iconos SVG como componentes
├── lib/
│   ├── prisma.ts           # singleton del client
│   ├── utils.ts            # cn() + helpers
│   └── error-handling.ts   # AppError + handleApiError
├── schemas/
└── middleware.ts           # Clerk authMiddleware
```

### 2.2. Reglas implícitas que hacen que escale

| Regla | Por qué funciona |
|---|---|
| **Una carpeta = una feature**, tanto en `actions/`, `hooks/`, `components/`, `schemas/` | Buscar todo lo relacionado con "billing" o "settings" es seguir el nombre — no hay que cazar archivos. |
| **Server Actions en `actions/<feature>/index.ts` con prefijo `on...`** (`onLoginUser`, `onIntegrateDomain`, `onGetCurrentChatBot`) | Convención de nombres explícita: `on*` = side-effect / handler. Greppable. |
| **Custom hooks en `hooks/<feature>/use-<feature>.ts`** que **encapsulan** form + actions + toast + router | El componente nunca llama a un server action directo; solo consume un hook. Esto separa UI de orquestación. |
| **Schemas Zod + tipos TS exportados juntos** (`UserRegistrationProps` + `UserRegistrationSchema`) | El tipo del form se infiere del schema. Una sola fuente de verdad. |
| **`components/ui/*` (shadcn) intocable**, lógica de negocio vive en `components/<feature>/*` | Permite actualizar primitives sin tocar lógica, y reutilizarlos en cualquier feature. |

✅ **Patrón a replicar:** si abres cualquier feature nueva, escribe **siempre** estos 4 archivos antes de la UI:
- `actions/<feature>/index.ts` (con `'use server'` arriba)
- `schemas/<feature>.schema.ts`
- `hooks/<feature>/use-<feature>.ts`
- `components/<feature>/*` (presentational)

---

## 3. Por qué la app **se siente rápida**

### 3.1. Route Groups + layouts anidados

[`src/app/(dashboard)/layout.tsx`](src/app/(dashboard)/layout.tsx) es la clave de la consistencia del sidebar:

```tsx
const OwnerLayout = async ({ children }: Props) => {
  const authenticated = await onLoginUser()
  if (!authenticated) { redirect('/auth/sign-in'); return null; }
  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <SideBar domains={authenticated.domain} />
        <div className="w-full h-screen flex flex-col pl-20 md:pl-4">
          {children}
        </div>
      </div>
    </ChatProvider>
  )
}
```

**Lo que ocurre cuando navegas entre `/dashboard` → `/conversation` → `/settings`:**

1. El layout es un **React Server Component** que se ejecuta **una sola vez** (auth + fetch de dominios). Next.js no lo desmonta entre rutas dentro del grupo.
2. El `<SideBar />` recibe `domains` como prop estable → **no se re-fetchea**.
3. El `<ChatProvider />` preserva estado (chatRoom, realtime, etc.) entre páginas.
4. Solo `{children}` se reemplaza, y se streamea desde el servidor.

> Por eso el sidebar es "consistente": **no se vuelve a renderizar; solo cambia el active state porque `usePathname()` cambia.**

✅ **Para replicar:** envuelve todas las páginas autenticadas en `app/(authenticated)/layout.tsx` (o el nombre que uses). Haz auth + fetch del shell **ahí**, no en cada page.

### 3.2. Server Components para el shell y datos críticos

[`src/app/(dashboard)/dashboard/page.tsx`](src/app/(dashboard)/dashboard/page.tsx) hace 6 fetches en paralelo desde el servidor:

```tsx
const Page = async () => {
  const clients = await getUserClients()
  const sales = await getUserBalance()
  const bookings = await getUserAppointments()
  const plan = await getUserPlanInfo()
  const transactions = await getUserTransactions()
  const products = await getUserTotalProductPrices()
  return ( ... )
}
```

No hay `useEffect` + `useState` + loading state en cliente: cuando el HTML llega al navegador, **ya tiene los datos**. Esto elimina la "cascada" de spinners típica de SPAs.

⚠️ **Mejora:** estos `await` son secuenciales. Para reducir TTFB, usa `Promise.all`:

```tsx
const [clients, sales, bookings, plan, transactions, products] = await Promise.all([
  getUserClients(),
  getUserBalance(),
  getUserAppointments(),
  getUserPlanInfo(),
  getUserTransactions(),
  getUserTotalProductPrices(),
])
```

### 3.3. Animaciones en CSS, no en JS

`tailwind.config.ts` define keyframes para el sidebar:

```ts
"open-sidebar":  { from: { width: "60px"  }, to: { width: "300px" } },
"close-sidebar": { from: { width: "300px" }, to: { width: "60px"  } },
"fade-in":       { from: { opacity: "0"   }, to: { opacity: "1"   } },
```

`SideBar.tsx` solo intercambia clases:

```tsx
className={cn(
  'bg-cream dark:bg-neutral-950 h-full w-[60px] ... transition-all duration-300',
  expand === true  ? 'animate-open-sidebar'  : '',
  expand === false ? 'animate-close-sidebar' : '',
)}
```

✅ **Patrón a replicar:** **nunca animes width/height/opacity con `useState` y `setInterval`.** Toda animación que dependa solo de un estado boolean debe ir a `keyframes` y aplicarse vía clase.

### 3.4. `next/font` con `Plus_Jakarta_Sans({ subsets: ['latin'] })`

[`src/app/layout.tsx`](src/app/layout.tsx) carga la fuente con auto-optimization de Next: self-hosted, `font-display: swap`, subset filtrado. No hay FOUT visible.

### 3.5. `next/image` con `priority` y `blurDataURL`

[`src/app/page.tsx`](src/app/page.tsx#L82-L97) usa `priority` para el hero LCP y `blurDataURL` (base64 minúsculo) para las cards de blog. Esto da una experiencia perceptiva muy rápida sin layout shift.

### 3.6. `next/dynamic` para componentes pesados del cliente

[`src/components/forms/settings/form.tsx`](src/components/forms/settings/form.tsx#L14-L19):

```tsx
const WelcomeMessage = dynamic(
  () => import('./greetings-message').then((p) => p.default),
  { ssr: false }
)
```

[`src/components/forms/sign-up/registration-step.tsx`](src/components/forms/sign-up/registration-step.tsx#L9-L17):

```tsx
const DetailForm = dynamic(() => import('./account-details-form'), {
  ssr: false,
  loading: SpinnerWrapper,
})
const OTPForm   = dynamic(() => import('./otp-form'), {
  ssr: false,
  loading: SpinnerWrapper,
})
```

Esto excluye el JS de pasos del wizard del bundle inicial. **El registro carga solo el step 1.**

### 3.7. Tailwind con CSS variables HSL (theme system)

[`src/app/globals.css`](src/app/globals.css#L24-L78) define el tema en CSS variables:

```css
:root  { --background: 0 0% 100%; --primary: 222.2 47.4% 11.2%; ... }
.dark  { --background: 222.2 84% 4.9%; --primary: 210 40% 98%;  ... }
```

`tailwind.config.ts` los consume con `hsl(var(--background))`. Cambiar tema = cambiar **una clase** en `<html>`. Cero re-renders, cero FOUC porque `next-themes` usa `disableTransitionOnChange`.

✅ **Patrón a replicar:** **nunca uses colores hex hardcoded** en componentes. Define todo en CSS vars y úsalos vía Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`).

---

## 4. Capa de datos: Prisma

### 4.1. Singleton del client (correcto para Next.js dev mode)

[`src/lib/prisma.ts`](src/lib/prisma.ts):

```ts
declare global { var prisma: PrismaClient | undefined }
export const client = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client
```

✅ Evita exhaurir conexiones cuando Next hot-reloads.

### 4.2. `select` exhaustivo en TODAS las queries

Ejemplo en [`onLoginUser`](src/actions/auth/index.ts#L36-L59):

```ts
await client.user.findUnique({
  where: { clerkId: user.id },
  select: { fullname: true, id: true, type: true },  // ← solo lo necesario
})
```

Y en queries con relaciones, [`onGetAllAccountDomains`](src/actions/settings/index.ts#L108-L141) selecciona la rama exacta:

```ts
select: {
  id: true,
  domains: {
    select: {
      name: true, icon: true, id: true,
      customer: {
        select: {
          chatRoom: { select: { id: true, live: true } }
        }
      }
    }
  }
}
```

**Por qué importa:** Prisma sin `select` trae **todas las columnas** + relaciones eager — explota el payload, sobrecarga el cliente, y obliga a serializar Date/Decimal innecesarios. Esto es de las cosas que más impacta latencia percibida.

✅ **Patrón a replicar:** prohíbe en code review queries sin `select`. (Salvo en mutations donde necesitas el objeto completo).

### 4.3. Schema bien tipado

[`prisma/schema.prisma`](prisma/schema.prisma):

- **UUID v4 generado por DB** (`@default(dbgenerated("gen_random_uuid()"))`) — no UUID en app, no colisiones, no latencia extra.
- **`onDelete: Cascade`** en relaciones de propiedad (User→Domain→ChatBot, ChatRoom→ChatMessage) — limpieza automática.
- **Enums** para `Plans` y `Role` — type-safe en TS y en DB.

⚠️ **Mejora:** falta `@@index` explícito en foreign keys consultadas a menudo. Recomiendo:

```prisma
model ChatMessage { ... @@index([chatRoomId]) }
model Customer    { ... @@index([domainId])  }
model HelpDesk    { ... @@index([domainId])  }
model FilterQuestions { ... @@index([domainId]) }
```

⚠️ **Mejora:** `Domain.userId` es opcional (`String?`). Si un domain siempre pertenece a un user, hazlo `String` (NOT NULL). Evita estados imposibles.

---

## 5. Formularios: el patrón estrella

Este es probablemente el mayor diferenciador de UX del proyecto.

### 5.1. La trinidad: `useForm` + `zodResolver` + `<FormGenerator />`

[`src/hooks/sign-up/use-sign-up.ts`](src/hooks/sign-up/use-sign-up.ts):

```ts
const methods = useForm<UserRegistrationProps>({
  resolver: zodResolver(UserRegistrationSchema),
  defaultValues: { type: 'owner' },
  mode: 'onChange',
})
```

[`src/components/forms/form-generator/index.tsx`](src/components/forms/form-generator/index.tsx) acepta un `name`, un `inputType` ("input" | "select" | "textarea"), `register`, `errors`, y se encarga del label + input + error message. Esto se usa en literalmente todos los formularios.

**Por qué es rápido:**
- React Hook Form usa **uncontrolled inputs + refs** → no re-renderiza el formulario entero por cada keystroke.
- Validación con `mode: 'onChange'` pero solo del field tocado.
- Los errors se muestran con `<ErrorMessage from="@hookform/error-message">` (renderiza inline sin tirar el form).

### 5.2. Schemas Zod con types co-localizados

[`src/schemas/auth.schema.ts`](src/schemas/auth.schema.ts):

```ts
export type UserRegistrationProps = { type: string; fullname: string; ... }
export const UserRegistrationSchema: ZodType<UserRegistrationProps> = z.object({...})
  .refine((s) => s.password === s.confirmPassword, { ... })
  .refine((s) => s.email === s.confirmEmail,       { ... })
```

✅ El tipo TS se mantiene **sincronizado con la validación** y el form lo consume con `useForm<UserRegistrationProps>`. End-to-end type-safety.

### 5.3. El hook por feature orquesta TODO

[`src/hooks/sign-up/use-sign-up.ts`](src/hooks/sign-up/use-sign-up.ts) hace dentro:
1. Setup del form (`useForm` + `zodResolver`)
2. Llamadas al servicio externo (Clerk: `signUp.prepareEmailAddressVerification`)
3. Llamada al server action (`onCompleteUserRegistration`)
4. Side-effects (router.push, toast, loading)
5. Devuelve `{ methods, onHandleSubmit, loading }`

El componente solo hace `const { methods, onHandleSubmit, loading } = useSignUpForm()`. **Cero lógica en JSX.**

✅ **Patrón a replicar:** cada formulario nuevo en otro SaaS = un schema Zod + un hook `use-<feature>` + un componente que solo renderiza. **Siempre los tres.**

---

## 6. Server Actions: el reemplazo de la capa API REST

13 archivos en `actions/*`, todos con `'use server'` arriba. Permiten llamar funciones del servidor desde el cliente como si fueran locales, con serialización automática.

### 6.1. Pattern bueno: validación + auth + try/catch + return shape consistente

[`src/actions/settings/index.ts → onIntegrateDomain`](src/actions/settings/index.ts#L5-L82):

```ts
export const onIntegrateDomain = async (domain: string, icon: string) => {
  const user = await currentUser()
  if (!user) return
  try {
    const subscription = await client.user.findUnique({ ... })
    const domainExists = await client.user.findFirst({ ... })
    if (!domainExists) {
      if ((plan === 'STANDARD' && count < 1) ||
          (plan === 'PRO'      && count < 2) ||
          (plan === 'ULTIMATE' && count < 10)) {
        // crear domain
        return { status: 200, message: 'Dominio añadido correctamente' }
      }
      return { status: 400, message: 'Has alcanzado el número máximo de dominios' }
    }
    return { status: 400, message: 'El dominio ya existe' }
  } catch (error) { console.log(error) }
}
```

**Lo bueno:** `{ status, message }` consistente; el client hace `if (data.status === 200) toast({...})` de forma uniforme.

**Lo aún mejor (ya empezó):** en [`src/lib/error-handling.ts`](src/lib/error-handling.ts) hay un sistema más completo con `AppError` + `ErrorType` enum + `handleApiError`. Está aplicado en `actions/mercadoPago` y `actions/stripe` (los más nuevos):

```ts
export const onProcessPayment = async (...): Promise<ApiResponse> => {
  try {
    validatePaymentData(paymentData);
    const user = await currentUser();
    if (!user) throw new AppError("Usuario no autenticado", ErrorType.AUTHENTICATION, 401);
    ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

⚠️ **Tarea pendiente:** migrar **todos** los actions viejos (`auth/`, `settings/`, `bot/`, `dashboard/`, `conversation/`) a este patrón. Hoy hay 86 `console.log` y muchos `try{} catch{}` que se "tragan" el error.

### 6.2. Idempotency keys en pagos

[`src/actions/stripe/index.ts`](src/actions/stripe/index.ts#L36-L46):

```ts
const idempotencyKey = uuidv4();
const paymentIntent = await stripe.paymentIntents.create(
  { amount, currency: 'usd', automatic_payment_methods: { enabled: true } },
  { idempotencyKey, stripeAccount: accountId }
);
```

✅ **Patrón a replicar en cualquier SaaS con pagos.** Stripe (y MercadoPago) deduplica peticiones con la misma key. Evita doble cobro si el cliente reintenta.

---

## 7. UX/Estado: pequeños detalles que suman

### 7.1. `<Loader loading={...}>{children}</Loader>`

[`src/components/loader/index.tsx`](src/components/loader/index.tsx):

```tsx
export const Loader = ({ loading, children, ... }) =>
  loading ? <div><Spinner /></div> : children
```

Patrón compositivo que se usa en TODO el proyecto: `<Loader loading={deleting}>Eliminar Dominio</Loader>`. Reemplaza un patrón conditional rendering repetido.

### 7.2. `<AppDrawer>`, `<Modal>` como composiciones de Radix

[`src/components/sidebar/domain-menu.tsx`](src/components/sidebar/domain-menu.tsx#L32-L68) muestra cómo se compone:

```tsx
<AppDrawer description="..." title="..." onOpen={<div><Plus /></div>}>
  <Loader loading={loading}>
    <form onSubmit={onAddDomain}>
      <FormGenerator inputType="input" register={register} ... />
      <UploadButton register={register} ... />
      <Button type="submit">Añadir Dominio</Button>
    </form>
  </Loader>
</AppDrawer>
```

`AppDrawer` recibe el trigger como prop (`onOpen`), el contenido como children. Esto se replica con `<Modal>`, `<Sheet>`, etc. → componentes inversor de control limpios.

### 7.3. `useToast` (shadcn) + `<Toaster />` globales

Todos los hooks devuelven feedback consistente con:

```ts
toast({ title: 'Success', description: result.message })
```

✅ Una única UI de toast para todo el sistema, montada una vez en root layout.

### 7.4. `router.refresh()` tras mutations

[`src/hooks/sidebar/use-domain.ts`](src/hooks/sidebar/use-domain.ts#L36-L49):

```ts
const onAddDomain = handleSubmit(async (values) => {
  setLoading(true)
  const uploaded = await upload.uploadFile(values.image[0])
  const domain = await onIntegrateDomain(values.domain, uploaded.uuid)
  if (domain) { reset(); setLoading(false); toast({...}); router.refresh() }
})
```

`router.refresh()` re-ejecuta los Server Components del segmento actual **sin perder estado del cliente**. Es la forma idiomática Next 14 de "revalidar después de mutar".

---

## 8. Realtime: Pusher como capa managed

[`src/lib/utils.ts`](src/lib/utils.ts#L15-L30) instancia `PusherServer` y `Pusher` (cliente). Server actions publican (`pusherServer.trigger`), y los hooks (`useChatBot`, `useRealTime`) se suscriben:

```ts
useEffect(() => {
  pusherClient.subscribe(chatRoom)
  pusherClient.bind("realtime-mode", (data: any) => setChats((prev) => [...prev, ...]))
  return () => { pusherClient.unbind("realtime-mode"); pusherClient.unsubscribe(chatRoom) }
}, [chatRoom])
```

✅ Patrón limpio: bind + unbind + unsubscribe en cleanup. Pusher es el caballo de batalla para evitar montar tu propio WebSocket server (que en serverless = pesadilla).

🔴 **Problema crítico de seguridad** — ver §10.1.

---

## 8.bis. Sistema de notificaciones (4 capas)

El proyecto tiene **cuatro mecanismos distintos** de notificación, cada uno para un propósito específico. Esta es probablemente la pieza más sofisticada del SaaS y conviene replicarla tal cual.

### 8.bis.1. Mapa de las 4 capas

| Capa | Trigger | Destinatario | Latencia | Persistencia | Librería |
|---|---|---|---|---|---|
| **Toast** | Acción del usuario (submit, click) | Mismo usuario, misma sesión | <100ms | No (efímero) | `@radix-ui/react-toast` + reducer estilo react-hot-toast |
| **Realtime push** | Evento del servidor (mensaje, toggle live) | Cualquier cliente suscrito al canal | ~200ms | No (solo entrega en vivo) | `pusher` + `pusher-js` |
| **Email** | Evento crítico (campaña, escalado a humano, contacto) | Fuera de la app | segundos-minutos | Sí (en el inbox) | `nodemailer` + Gmail SMTP |
| **Unread flag** | Mensaje nuevo en DB | Dueño del dominio al volver | recupera al cargar | Sí (`seen: Boolean` en `ChatMessage`) | Prisma |

### 8.bis.2. Capa 1 — Toast UI (feedback síncrono)

**Componentes implicados:**
- [`src/components/ui/toast.tsx`](src/components/ui/toast.tsx) — primitives de Radix con variantes `default` / `destructive` (CVA).
- [`src/components/ui/use-toast.ts`](src/components/ui/use-toast.ts) — reducer global con dispatcher externo a React (inspirado en `react-hot-toast`).
- [`src/components/ui/toaster.tsx`](src/components/ui/toaster.tsx) — `<Toaster />` que se monta una vez en root.
- [`src/app/layout.tsx`](src/app/layout.tsx#L31) — montaje global del Toaster.

**Cómo funciona el reducer interno:** [`use-toast.ts`](src/components/ui/use-toast.ts#L132-L141) mantiene un `memoryState` fuera de React y un array de `listeners`. Cada `useToast()` se suscribe a esos listeners en `useEffect`. Cualquier componente puede llamar `toast({...})` sin necesidad de un Provider envolvente porque el estado vive fuera del árbol React.

```ts
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}
```

✅ **Patrón a replicar:** este pattern (state externo a React + listeners) permite invocar el toast desde **cualquier sitio** — incluso fuera de componentes (workers, callbacks de WebSocket, errores globales) — sin prop drilling de un contexto.

**Uso uniforme en TODOS los hooks de la app:**

```ts
// src/hooks/sidebar/use-domain.ts:43
toast({ title: domain.status == 200 ? 'Success' : 'Error', description: domain.message })

// src/hooks/sign-up/use-sign-up.ts:39
toast({ title: 'Error', description: error.errors[0].longMessage })

// src/hooks/billling/use-billing.ts:159
toast({ title: 'Success', description: 'Pago procesado correctamente' })
```

→ **24+ invocaciones** en hooks de feature. La convención es `{ title, description }` y la decisión de variante (success/error) la toma el llamador en base a `status === 200`.

⚠️ **Limitación intencional (`TOAST_LIMIT = 1`)** en [`use-toast.ts:11`](src/components/ui/use-toast.ts#L11): solo se muestra UN toast a la vez. El nuevo reemplaza al anterior. Es decisión de UX, pero conviene saber que **si disparas dos `toast()` seguidos, solo verás el segundo.** Si tu otro SaaS necesita stack, sube ese límite a 3-5.

⚠️ **`TOAST_REMOVE_DELAY = 1000000`** (~16 minutos): el toast se cierra visualmente pero permanece en memoria 16 min. Es el default de shadcn y no afecta nada salvo que generes miles. Considera bajarlo a `5000`.

⚠️ **`sonner.tsx` está exportado pero nunca se monta** — [`src/components/ui/sonner.tsx`](src/components/ui/sonner.tsx) wraps `sonner`, pero el layout usa `<Toaster />` de Radix, no este. **Bundle muerto.** Decide cuál usas: Sonner (más moderno, animaciones mejores, soporta promesa) o el Radix actual. Eliminar el no usado.

### 8.bis.2.1. El patrón "Action → Toast" en detalle (success/error feedback)

Este es **el patrón más usado del proyecto** (50+ invocaciones) y el responsable de las notificaciones que aparecen cuando creas un dominio, una campaña, actualizas settings, etc. Es lo que da esa sensación de "la app responde a todo lo que hago".

**La cadena completa, paso a paso, para "Crear dominio":**

```
[1. Usuario llena form en el sidebar y click "Añadir Dominio"]
   ↓
   components/sidebar/domain-menu.tsx → <form onSubmit={onAddDomain}>
   ↓
[2. Hook ejecuta onAddDomain (RHF handleSubmit)]
   ↓
   hooks/sidebar/use-domain.ts:36
   const onAddDomain = handleSubmit(async (values) => {
     setLoading(true)
     const uploaded = await upload.uploadFile(values.image[0])
     const domain = await onIntegrateDomain(values.domain, uploaded.uuid)   ←── server action
     ↓
[3. Server action retorna shape consistente]
   ↓
   actions/settings/index.ts:65
   return { status: 200, message: 'Dominio añadido correctamente' }   // success
   // o
   return { status: 400, message: 'Has alcanzado el número máximo de dominios' }  // error
   ↓
[4. Hook dispara toast + reset + refresh]
   ↓
   if (domain) {
     reset()
     setLoading(false)
     toast({
       title: domain.status == 200 ? 'Success' : 'Error',   //  ← decisión de variante
       description: domain.message,                          //  ← mensaje del server
     })
     router.refresh()                                        //  ← re-fetch RSC
   }
   ↓
[5. <Toaster /> global lo renderiza arriba a la derecha]
```

**Misma cadena para "Crear campaña de email marketing":**

[`src/hooks/email-marketing/use-marketing.ts:47-63`](src/hooks/email-marketing/use-marketing.ts#L47-L63):

```ts
const onCreateCampaign = handleSubmit(async (values) => {
  try {
    setLoading(true)
    const campaign = await onCreateMarketingCampaign(values.name)
    if (campaign) {
      reset()
      toast({ title: 'Success', description: campaign.message })   // ← idéntico patrón
      setLoading(false)
      router.refresh()
    }
  } catch (error) { console.log(error) }
})
```

### Los tres "pactos" que hacen que esto sea consistente

Todo el feedback de éxito/error funciona porque hay **tres convenciones implícitas** que se respetan en TODOS los hooks:

#### Pacto 1: **El server action SIEMPRE retorna `{ status, message }`**

El mensaje **lo decide el server**, no el cliente. Esto es clave:

```ts
// actions/settings/index.ts
return { status: 200, message: 'Dominio añadido correctamente' }
return { status: 400, message: 'Has alcanzado el número máximo de dominios' }
return { status: 400, message: 'El dominio ya existe' }

// actions/mail/index.ts
return { status: 200, message: 'Campaign created' }

// actions/settings/index.ts (helpdesk)
return { status: 200, message: 'New help desk question added' }
```

✅ **Beneficio:** si mañana cambias el copy de "Dominio añadido correctamente" a "Dominio creado ✓", **cambias UN solo string en el server**, no en 5 componentes. El cliente es ignorante del wording.

⚠️ **Inconsistencia detectada:** algunos mensajes están en español, otros en inglés ("Campaign created", "Welcome message updated"). Conviene unificar — pasar todos a español o, mejor, a **claves de i18n** (`'domain.created'`) y traducir en el cliente.

#### Pacto 2: **El hook SIEMPRE decide la variante en base al status**

```ts
toast({
  title: domain.status == 200 ? 'Success' : 'Error',
  description: domain.message,
})
```

No es `if (status===200) toast.success(...); else toast.error(...)`. Es **un solo `toast()`** con título derivado. Esto reduce ramas en cada hook.

⚠️ **Mejora menor:** el título es siempre literal `'Success'` o `'Error'`. Está en inglés en una app en español. Podría ser `'Éxito'` / `'Error'` o, mejor, sin título → el `description` ya lo dice todo.

#### Pacto 3: **`router.refresh()` después de cualquier mutación**

```ts
toast({ ... })
router.refresh()   // ← re-ejecuta los Server Components de la ruta actual
```

[`use-domain.ts:47`](src/hooks/sidebar/use-domain.ts#L47), [`use-marketing.ts:58`](src/hooks/email-marketing/use-marketing.ts#L58), [`use-settings.ts:127`](src/hooks/settings/use-settings.ts#L127), etc. — **TODOS** lo hacen.

✅ **Por qué es importante:** el RSC del dashboard (que muestra la lista de dominios o campañas) se re-ejecuta en el servidor y **trae el nuevo registro recién creado**, sin perder el estado del cliente (formularios abiertos, scroll, etc.). Es lo que hace que veas el dominio nuevo en el sidebar **al instante** después del toast.

### Plantilla genérica para un nuevo formulario en otro SaaS

Si quieres replicar este patrón en otro SaaS Next.js, **cualquier acción que cree/edite algo** debe seguir esta forma exacta:

```ts
// 1) actions/<feature>/index.ts
'use server'
export const onCreateX = async (data: XInput) => {
  const user = await currentUser()
  if (!user) return { status: 401, message: 'No autenticado' }
  try {
    const validated = XSchema.parse(data)                  // valida con zod
    const created = await client.x.create({ data: validated })
    if (created) return { status: 200, message: 'X creado correctamente' }
    return { status: 400, message: 'No se pudo crear X' }
  } catch (e) {
    return handleApiError(e)   // de lib/error-handling.ts
  }
}

// 2) hooks/<feature>/use-x.ts
export const useCreateX = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<XInput>({
    resolver: zodResolver(XSchema),
  })
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onCreate = handleSubmit(async (values) => {
    setLoading(true)
    const result = await onCreateX(values)
    if (result) {
      reset()
      setLoading(false)
      toast({
        title: result.status === 200 ? 'Success' : 'Error',
        description: result.message,
      })
      if (result.status === 200) router.refresh()
    }
  })

  return { register, onCreate, errors, loading }
}

// 3) components/<feature>/create-x-form.tsx
'use client'
const CreateXForm = () => {
  const { register, onCreate, errors, loading } = useCreateX()
  return (
    <form onSubmit={onCreate}>
      <FormGenerator name="title" register={register} errors={errors} ... />
      <Button type="submit"><Loader loading={loading}>Crear X</Loader></Button>
    </form>
  )
}
```

✅ **Cada formulario nuevo = 3 archivos en 3 carpetas**, sin pensar. Esa repetición disciplinada es lo que hace que la app "se sienta igual de pulida" en todas partes.

### Inventario de toasts del proyecto (dónde se dispara cada notificación)

| Acción | Hook | Server action | Mensaje del server |
|---|---|---|---|
| Crear dominio | `useDomain.onAddDomain` | `onIntegrateDomain` | "Dominio añadido correctamente" / "El dominio ya existe" / "Has alcanzado el número máximo de dominios" |
| Eliminar dominio | `useSettings.onDeleteDomain` | `onDeleteUserDomain` | "<nombre> was deleted successfully" |
| Actualizar settings dominio | `useSettings.onUpdateSettings` | `onUpdateDomain` / `onChatBotImageUpdate` / `onUpdateWelcomeMessage` | "Domain updated" / "Welcome message updated" |
| Crear pregunta helpdesk | `useHelpDesk.onSubmitQuestion` | `onCreateHelpDeskQuestion` | "New help desk question added" |
| Crear filter question | `useFilterQuestions.onAddFilterQuestions` | `onCreateFilterQuestions` | "Filter question added" |
| Crear producto | `useProducts.onCreateNewProduct` | `onCreateNewDomainProduct` | "Product successfully created" |
| Crear campaña marketing | `useEmailMarketing.onCreateCampaign` | `onCreateMarketingCampaign` | (lo retorna el server) |
| Guardar template email | `useEmailMarketing.onCreateEmailTemplate` | `onSaveEmailTemplate` | (lo retorna el server) |
| Añadir customers a campaña | `useEmailMarketing.onAddCustomersToCampaign` | `onAddCustomersToEmail` | (lo retorna el server) |
| Envío masivo de campaña | `useEmailMarketing.onBulkEmail` | `onBulkMailer` | "Correos electrónicos de campaña enviados exitosamente" |
| Cambiar contraseña | `useChangePassword.onChangePassword` | `onUpdatePassword` | "Password updated" |
| Toggle realtime chat | `useSideBar.onActivateRealtime` | `onToggleRealtime` | "Realtime mode enabled" / "Realtime mode disabled" |
| Sign-up error (Clerk) | `useSignUpForm.onGenerateOTP` | (no, Clerk error) | error.errors[0].longMessage |
| Sign-in error (Clerk) | `useSignIn` | (no, Clerk error) | error.errors[0].longMessage |
| Form de contacto | `useContactForm` | `onSendContactEmail` | "Mensaje enviado correctamente" |
| Pago Stripe success | `useStripe` | `onUpdateSubscription` | "subscription updated" |
| Pago MercadoPago success | `useMercadoPago` | `onProcessPayment` | "Pago aprobado y suscripción actualizada" |

→ **17 acciones diferentes** que usan exactamente el mismo patrón. **Cero código de notificación duplicado** porque toda la decisión está en el `toast({...})` de una sola línea.

### 8.bis.3. Capa 2 — Realtime push con Pusher

**Server emite, cliente escucha.** Esta es la pieza que hace que el chatbot pase de "AI" a "humano" en vivo sin polling.

**Server actions que disparan eventos:**

[`src/actions/conversation/index.ts`](src/actions/conversation/index.ts) — dos canales/eventos distintos:

```ts
// Evento 1: el dueño toggleó realtime mode en el sidebar
pusherServer.trigger(chatRoom.id, 'realtime-mode-updated', { live: chatRoom.live })

// Evento 2: hay un mensaje nuevo en el chat
pusherServer.trigger(chatroomId, 'realtime-mode', { chat: { message, id, role } })
```

**Cliente que escucha:**

[`src/hooks/chatbot/use-chatbot.ts`](src/hooks/chatbot/use-chatbot.ts#L184-L222) suscribe al canal cuando `onRealTime.chatroom` está set:

```ts
useEffect(() => {
  if (onRealTime?.chatroom) {
    pusherClient.subscribe(onRealTime.chatroom)

    pusherClient.bind('realtime-mode-updated', (data) => {
      if (!data.live) setOnRealTime(undefined)
      else setOnRealTime((prev) => ({ ...prev!, mode: data.live }))
    })

    pusherClient.bind('realtime-mode', (data) => {
      setOnChats((prev) => [...prev, { role: data.chat.role, content: data.chat.message }])
    })

    return () => {
      pusherClient.unbind('realtime-mode-updated')
      pusherClient.unbind('realtime-mode')
      pusherClient.unsubscribe(onRealTime.chatroom)   // ← cleanup correcto
    }
  }
}, [onRealTime?.chatroom])
```

✅ **Patrón a replicar:**

1. **Un canal por entidad** (aquí `chatRoomId` es el nombre del canal). Aísla cada conversación.
2. **Eventos con nombre descriptivo en kebab-case** (`realtime-mode-updated`, `realtime-mode`).
3. **Cleanup obligatorio** en el return del effect: `unbind` cada listener y `unsubscribe` del canal. Olvidar esto causa **memory leaks** y **mensajes fantasma** después de navegar.
4. **El cliente Pusher se inicializa una sola vez** en [`src/lib/utils.ts`](src/lib/utils.ts) (no en cada componente).

🔴 **Problema crítico ya mencionado en §10.1:** el `secret` de Pusher está en `NEXT_PUBLIC_PUSHER_APP_SECRET`. Eso permite a cualquier visitante con DevTools **publicar a cualquier canal**, incluyendo eventos falsos `realtime-mode` que aparecerán como mensajes legítimos. **Splittear** `pusher.server.ts` (con secret, importado solo desde `actions/`) de `pusher.client.ts` (con key + cluster públicos).

⚠️ **No hay canales privados / autenticados.** Cualquier cliente puede `pusherClient.subscribe(<chatRoomId>)` y escuchar conversaciones ajenas si conoce o adivina el UUID. Para producción seria, usa [Pusher Private Channels](https://pusher.com/docs/channels/server_api/authenticating-users/) (prefijo `private-`) + endpoint de auth en Next.js.

### 8.bis.4. Capa 3 — Email (Nodemailer + Gmail SMTP)

Tres flujos distintos, todos usan SMTP de Gmail con app password:

**1. Notificar al dueño cuando un cliente pasa a realtime humano:**

[`src/actions/mailler/index.tsx`](src/actions/mailler/index.tsx) (sic, doble L):

```ts
export const onMailer = (email: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.NODE_MAILER_EMAIL, pass: process.env.NODE_MAILER_GMAIL_APP_PASSWORD },
  })
  const mailOptions = {
    to: email,
    subject: 'Realtime Support',
    text: 'Uno de sus clientes en Sersi acaba de cambiar al modo en tiempo real',
  }
  transporter.sendMail(mailOptions, (error, info) => { ... })
}
```

Se invoca desde [`src/actions/bot/index.ts:178`](src/actions/bot/index.ts#L178) y se combina con el flag `chatRoom.mailed = true` para **no spamear** — solo se envía la primera vez por chatroom.

**2. Campañas de email marketing (con créditos):**

[`src/actions/mail/index.ts:223-257`](src/actions/mail/index.ts#L223-L257):

```ts
const transporter = nodemailer.createTransport({...})  // misma config que onMailer
const info = await transporter.sendMail({ from, to: emails, subject: template.name, text: ... })

// decrementa créditos del plan tras enviar
await client.user.update({
  where: { clerkId: user.id },
  data: { subscription: { update: { credits: { decrement: emails.length } } } },
})
```

✅ **Patrón a replicar:** acoplar el envío al **consumo de un recurso del plan** (créditos). Es la mecánica básica de cualquier SaaS con tier de uso.

**3. Form de contacto en la landing:**

[`src/actions/contact/index.ts`](src/actions/contact/index.ts) con `validateContactData` (Zod-style assertions) + `handleApiError`. Es el ejemplo más limpio del proyecto — patrón a copiar.

### Anti-patterns en la capa email

| # | Problema | Archivo | Fix |
|---|---|---|---|
| A | **Tres transporters duplicados** con la misma config (smtp.gmail.com, port 465, secure, auth) | `actions/mailler`, `actions/mail`, `actions/contact` | Extraer a `lib/mailer.ts` con un `createTransport` lazy single instance |
| B | **Typo en el nombre del archivo** `mailler` (doble L) | `actions/mailler/index.tsx` | Renombrar a `actions/mailer/index.ts` (también es `.tsx` sin JSX → `.ts`) |
| C | **`onMailer` es fire-and-forget** (no es `async`, no espera, no retorna status) | `actions/mailler/index.tsx:21` | `await transporter.sendMail(...)` y retornar status |
| D | **Sin `from:`** en `onMailer` → Gmail puede rechazar como spam | `actions/mailler/index.tsx:15` | Agregar `from: process.env.NODE_MAILER_EMAIL` |
| E | **Sin retry/exponential backoff** | todos | Para volumen serio considerar Resend / SendGrid / SES con cola |
| F | **Gmail SMTP no escala** (límite ~500/día por cuenta) | todos | Migrar a proveedor transaccional cuando crezcas |
| G | **Logs de email exponen direcciones** (`console.log('Email sent: ' + info.response)`) | `actions/mailler/index.tsx:25` | Quitar o redactar |

### 8.bis.5. Capa 4 — Unread tracking (notificación in-app diferida)

El cuarto mecanismo es subutilizado pero está **modelado en el schema**:

```prisma
// prisma/schema.prisma
model ChatMessage {
  id         String   @id ...
  message    String
  role       Role?
  chatRoomId String?  @db.Uuid
  seen       Boolean  @default(false)   // ← flag para badges
  ChatRoom   ChatRoom? @relation(...)
}
```

Mutador: [`onViewUnReadMessages`](src/actions/conversation/index.ts#L129-L142) marca todos como vistos cuando el dueño abre el chat:

```ts
await client.chatMessage.updateMany({
  where: { chatRoomId: id },
  data: { seen: true },
})
```

Consumidor: [`onGetDomainChatRooms`](src/actions/conversation/index.ts#L55) trae los mensajes con `seen` para que el sidebar pueda mostrar un badge "X sin leer".

✅ **Patrón a replicar para cualquier inbox/feed:** un campo booleano `seen` (o `readAt: DateTime?`) en la entidad mensaje/notificación es lo mínimo viable para badges. Si quieres notification center completo, modela una tabla `Notification` separada con `type`, `payload Json`, `readAt`, `userId`.

### 8.bis.6. Cómo se combinan las 4 capas en un flujo real

Cuando un cliente final pasa a **modo realtime** en el chatbot embebido, ocurren las 4 capas en cascada:

```
Cliente del bot dice algo inapropiado/fuera de tema
  ↓
[Server action onAiChatBotAssistant] OpenAI responde con "(realtime)"
  ↓
1. DB: client.chatRoom.update({ live: true })
2. Email: onMailer(ownerEmail) → "tu cliente cambió a realtime"   ← CAPA 3
3. DB: chatRoom.mailed = true (anti-spam)
  ↓
[Server action onRealTimeChat]
  ↓
4. Pusher: pusherServer.trigger(chatRoomId, 'realtime-mode', {chat}) ← CAPA 2
  ↓
[Cliente del dueño suscrito al canal]
  ↓
5. setOnChats((prev) => [...prev, newMessage])
  ↓
6. seen: false → badge "1 sin leer" en el sidebar              ← CAPA 4
  ↓
[Dueño responde desde el dashboard]
  ↓
7. toast({ title: 'Mensaje enviado' })                          ← CAPA 1
```

✅ Esta **orquestación** es lo que hace que la app se sienta "viva". Replicarla:
- **Para feedback síncrono del usuario** → toast.
- **Para empujar estado nuevo a otros clientes conectados** → Pusher (o equivalente managed: Ably, Soketi, Supabase Realtime).
- **Para reach-out fuera de la sesión** → email/SMS.
- **Para recuperar lo que se perdió mientras no estabas** → flag persistido en DB.

### 8.bis.7. Checklist del sistema de notificaciones para tu próximo SaaS

- [ ] `<Toaster />` (Radix o Sonner — elige uno) montado **una vez** en root layout
- [ ] `useToast` o equivalente global, invocable desde cualquier hook sin Provider de feature
- [ ] Convención `{ title, description }` con variantes `default` / `destructive`
- [ ] `lib/realtime.server.ts` y `lib/realtime.client.ts` **separados** (no en el mismo archivo)
- [ ] Secrets de realtime **sin** `NEXT_PUBLIC_*`
- [ ] **Private channels** (auth endpoint) para canales con datos sensibles
- [ ] `unbind` + `unsubscribe` en cleanup de cada `useEffect`
- [ ] `lib/mailer.ts` con un **único** `createTransport` lazy
- [ ] Variables `MAILER_EMAIL` / `MAILER_PASSWORD` (sin sufijo `_GMAIL_APP_` — abstrae del proveedor)
- [ ] Para volumen >100 emails/día: proveedor transaccional (Resend / SES / SendGrid)
- [ ] Flag de anti-spam por entidad (`mailed: Boolean` en la tabla del evento)
- [ ] Campo `seen` / `readAt` en mensajes para badge "no leído"
- [ ] Si necesitas notification center: tabla `Notification` con `type`, `payload`, `readAt`, `userId`, `createdAt` indexado

---

## 9. Configuración base (next/tailwind/ts)

- [`tsconfig.json`](tsconfig.json): `strict: true`, paths `@/*` → `./src/*`, target moderno. ✅
- [`next.config.mjs`](next.config.mjs): `remotePatterns` whitelist correcto para `ucarecdn.com`; webpack config para SVGR (SVG como componentes). ✅
- [`tailwind.config.ts`](tailwind.config.ts): `container` con padding responsive (1rem→10rem), keyframes propios, plugin `tailwindcss-animate`. ✅
- [`components.json`](components.json): shadcn `rsc: true` + `cssVariables: true`. ✅
- `postinstall: "prisma generate"` → tipos siempre frescos en CI. ✅

---

## 10. 🔴 Hallazgos críticos a corregir

### 10.1. Secret de Pusher expuesto como `NEXT_PUBLIC_*`

[`src/lib/utils.ts`](src/lib/utils.ts#L15-L21):

```ts
export const pusherServer = new PusherServer({
  appId:   process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key:     process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret:  process.env.NEXT_PUBLIC_PUSHER_APP_SECRET,  // ❌ FILTRADO AL CLIENTE
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR,
})
```

Todo lo prefijado `NEXT_PUBLIC_` se inlinea en el **bundle del cliente**. Cualquiera con DevTools puede leerlo. El secret de Pusher permite publicar a cualquier canal en tu cuenta.

**Fix:**
1. Renombra a `PUSHER_APP_SECRET` (sin `NEXT_PUBLIC_`) en `.env`.
2. Splittea el archivo en dos:
   - `src/lib/pusher.server.ts` → `pusherServer` (import solo desde actions)
   - `src/lib/pusher.client.ts` → `pusherClient` (import desde hooks)
3. Sólo `appId` y `cluster` necesitan ser públicos si los usas en el cliente; `key` y `secret` no salen del server.

### 10.2. `metadata` por defecto "Create Next App"

[`src/app/layout.tsx`](src/app/layout.tsx#L10-L13):

```ts
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
}
```

Pierdes SEO. Fija título/descripción reales y agrega `openGraph`, `twitter`, `icons`, `metadataBase`.

### 10.3. Landing page (`/`) es Client Component con `useEffect` fetch

[`src/app/page.tsx`](src/app/page.tsx#L1-L49) tiene `"use client"` y usa `useEffect` para `onGetBlogPosts()`. Esto:
- Pierde SSR de los blog cards → mal SEO.
- Genera un flash de "no posts" antes del fetch.

Convierte a Server Component (quita `"use client"`, mueve los handlers de click a un sub-componente cliente). Los pricing cards y blogs se renderizan SSR.

### 10.4. Datos hardcoded de Stripe Connect (datos de prueba en código)

[`src/app/api/stripe/connect/route.ts`](src/app/api/stripe/connect/route.ts#L16-L107) crea cuentas con `'The Best Cookie Co'`, dirección `'123 State St'`, `'Jenny Rosen'`, etc. Es código de tutorial/demo. **Si esto se llamó alguna vez en producción está creando cuentas Stripe falsas vinculadas a usuarios reales.**

Además los URLs son `http://localhost:3000/callback/stripe/...` hardcoded:

```ts
refresh_url: 'http://localhost:3000/callback/stripe/refresh',
return_url:  'http://localhost:3000/callback/stripe/success',
```

**Fix:** este endpoint hay que reescribirlo. Debería:
1. Pedir al usuario sus datos reales (un form previo).
2. Usar `process.env.NEXT_PUBLIC_APP_URL` (o el host de la request) para los callbacks.
3. Idealmente migrar a Stripe Express o Standard accounts en vez de Custom (mucho menos compliance burden).

### 10.5. `console.log` en 24 archivos (86 ocurrencias)

Logs sensibles probables: payloads de pagos, mensajes de chat, IDs, suscripciones (`actions/mail/index.ts: 6 logs`).

**Fix mínimo:** un wrapper `lib/logger.ts`:

```ts
const isDev = process.env.NODE_ENV !== 'production'
export const log = {
  debug: (...a: any[]) => isDev && console.log(...a),
  error: (...a: any[]) => console.error(...a),
}
```

Y reemplaza con un find/replace. Mejor: agrega Sentry o Axiom para errores en producción.

### 10.6. Política de contraseñas demasiado laxa

[`src/schemas/auth.schema.ts`](src/schemas/auth.schema.ts#L20-L28):

```ts
.refine((value) => /^[a-zA-Z0-9_.-]*$/.test(value), 'solo letras y números')
```

Esto **prohíbe** símbolos como `!@#$%^&*()`, que son los que dan entropía. Cámbialo a:

```ts
.refine((v) => /[A-Z]/.test(v),   'Debe incluir una mayúscula')
.refine((v) => /[a-z]/.test(v),   'Debe incluir una minúscula')
.refine((v) => /\d/.test(v),      'Debe incluir un dígito')
.refine((v) => /[^A-Za-z0-9]/.test(v), 'Debe incluir un símbolo')
```

### 10.7. `middleware.ts` con `authMiddleware` legacy (Clerk v4)

[`src/middleware.ts`](src/middleware.ts) usa el API antiguo. Clerk v5 ya está disponible con `clerkMiddleware()` que es más rápido y compone mejor. Considera la migración cuando subas Clerk.

---

## 11. 🟡 Mejoras de calidad de código

| # | Hallazgo | Archivo | Acción |
|---|---|---|---|
| 11.1 | `try {} catch (e) { console.log(e) }` swallowing | `actions/auth/*`, `settings/*`, `bot/*`, `dashboard/*` | Migrar al patrón `handleApiError` que ya existe en `lib/error-handling.ts` |
| 11.2 | Fetches secuenciales en page.tsx del dashboard | `app/(dashboard)/dashboard/page.tsx` | Usar `Promise.all` (ver §3.2) |
| 11.3 | `force-dynamic` global en dashboard | `app/(dashboard)/dashboard/page.tsx:21` | Usar `revalidatePath('/dashboard')` desde los server actions tras mutación |
| 11.4 | `getMonthName` con cadena de ternarios | `lib/utils.ts:43-66` | Reemplaza por `new Intl.DateTimeFormat('en', { month: 'short' }).format(date)` |
| 11.5 | `useChatBot` hace demasiado (200+ líneas, embed + chat + realtime) | `hooks/chatbot/use-chatbot.ts` | Splittear en `useBotEmbed`, `useBotMessages`, `useBotRealtime` |
| 11.6 | `limitRequest` variable mutable en cuerpo del hook (`let limitRequest = 0`) | `hooks/chatbot/use-chatbot.ts:81` | Sustituir por `useRef(0)` |
| 11.7 | `onIntegrateDomain` no es atómico (check + create separados) | `actions/settings/index.ts:5` | Usar `client.$transaction([...])` |
| 11.8 | Hardcoded credit limits | `actions/stripe/index.ts:82`, `actions/mercadoPago/index.ts:176` | Extraer a `constants/plans.ts` |
| 11.9 | `Domain.userId` nullable pero la app asume siempre presente | `prisma/schema.prisma:29` | Hacer `String @db.Uuid` (NOT NULL) |
| 11.10 | Falta `@@index` en foreign keys consultadas | `prisma/schema.prisma` | Ver §4.3 |
| 11.11 | `defualt:` typo en `<FormGenerator>` (línea muerta) | `components/forms/form-generator/index.tsx:120` | Eliminar |
| 11.12 | `accordian`, `mondal`, `intex.tsx` (typos en carpetas) | `components/` | Renombrar |
| 11.13 | Falta `loading.tsx` y `error.tsx` en rutas | `app/(dashboard)/*/` | Agregar para usar Suspense streaming nativo |
| 11.14 | `customerEmail` como variable de módulo en `actions/bot/index.ts:65` | `actions/bot/index.ts` | 🔴 **Bug serio:** estado global compartido entre requests (en serverless puede leak entre usuarios). Mover a parámetro o sesión. |

### 11.14 (detalle) — Estado compartido entre requests

```ts
// actions/bot/index.ts:65
let customerEmail: string | undefined;   // ❌ Variable de módulo

export const onAiChatBotAssistant = async (...) => {
  ...
  if (extractedEmail) { customerEmail = extractedEmail[0]; }
  if (customerEmail) { ... }  // Otro request puede leer este valor
}
```

En Node.js los módulos se evalúan UNA vez por proceso. En Vercel serverless funciones pueden reutilizar el container entre invocaciones. **Dos usuarios distintos pueden compartir este `customerEmail`.** Es un bug de aislamiento clásico.

**Fix:** elimina el `let` global; busca el customer email dentro del scope de la función o pásalo como parámetro.

---

## 12. Checklist para replicar en otro SaaS

Copia esto a un nuevo proyecto Next.js:

### Estructura mínima
- [ ] `src/{actions,app,components,context,constants,hooks,icons,lib,schemas}/`
- [ ] `app/(authenticated)/layout.tsx` con auth + fetch del shell
- [ ] `app/(public)/layout.tsx` para landing/marketing
- [ ] `app/(auth)/layout.tsx` para sign-in/sign-up
- [ ] `lib/prisma.ts` con singleton pattern
- [ ] `lib/utils.ts` con `cn()` (clsx + tailwind-merge)
- [ ] `lib/error-handling.ts` con `AppError` + `handleApiError`
- [ ] `lib/logger.ts` con wrapper condicional

### Por cada feature
- [ ] `actions/<feature>/index.ts` con `'use server'`, funciones `on*`, retorno `{ status, message, data? }` o `ApiResponse<T>`
- [ ] `schemas/<feature>.schema.ts` con `Schema` (Zod) + `Props` (TS) co-localizados
- [ ] `hooks/<feature>/use-<feature>.ts` que encapsula `useForm` + actions + toast + router
- [ ] `components/<feature>/*` solo presentational

### Configuración base
- [ ] `tsconfig.json` con `strict: true` y `paths: { "@/*": ["./src/*"] }`
- [ ] `tailwind.config.ts` con CSS vars HSL en `globals.css` (`:root` + `.dark`)
- [ ] `next.config.mjs` con `remotePatterns` para tu CDN de imágenes
- [ ] `components.json` con shadcn (`rsc: true`, `cssVariables: true`)
- [ ] `next/font` para fuentes
- [ ] `ClerkProvider` + `ThemeProvider` (`next-themes` con `disableTransitionOnChange`) + `<Toaster />` en root layout
- [ ] `middleware.ts` con `publicRoutes` declarados

### Performance defaults
- [ ] Server Components por defecto; `'use client'` solo donde hay interactividad
- [ ] Fetches en page.tsx con `Promise.all`
- [ ] Animaciones en `tailwind.config.ts → keyframes`, nunca en JS
- [ ] `next/dynamic` con `ssr: false` para wizards/modales pesados
- [ ] `next/image` con `priority` en LCP y `blurDataURL` en cards
- [ ] Prisma con `select` exhaustivo en cada query
- [ ] `@@index` en cada foreign key consultada en lista

### Seguridad checklist
- [ ] Secrets en variables **sin** `NEXT_PUBLIC_*`
- [ ] Auth check en cada Server Action (`currentUser()` o equivalente)
- [ ] `validate<Resource>(data)` que use Zod o `asserts` antes de tocar DB
- [ ] Idempotency keys (UUID) en todas las operaciones de pago
- [ ] Logs sin info PII en producción
- [ ] CSP / headers de seguridad en `next.config.mjs`

---

## 13. Conclusión

**Lo que este proyecto hace mejor que el 90% de los SaaS comparables:**

1. Layout-driven architecture con Route Groups → el shell es estable, el contenido es streamed.
2. Server-first data fetching con `select` agresivo en Prisma → menos JS al cliente, menos JSON, menos lag.
3. Form layer unificado (hook + schema + generator) → cero boilerplate por formulario nuevo.
4. Animaciones declarativas en Tailwind → 60fps gratis.
5. Convención `on*` para server actions + carpetas por feature → grepability y onboarding rápido.
6. Idempotency en pagos.

**Lo que hay que limpiar antes de escalar más:**

1. Secret de Pusher expuesto (CRÍTICO).
2. Variable global `customerEmail` en `actions/bot` (CRÍTICO en serverless).
3. Endpoint `/api/stripe/connect` con datos de demo (CRÍTICO si vivo en prod).
4. Migración a `handleApiError` en los actions viejos.
5. Limpieza de `console.log`.
6. Metadata SEO y conversión de landing a RSC.
7. Política de contraseñas más fuerte.

Si replicas los **puntos 1-6 del primer bloque** en cualquier nuevo SaaS Next.js, vas a sentir la misma diferencia de velocidad que notas en este. El secreto no es ninguna librería mágica — es **disciplina arquitectónica consistente**.
