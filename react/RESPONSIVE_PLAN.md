# Responsive Plan

Breakpoint pivote: **`md` (768px)**. Mobile-first.
- `< md` → móvil: layouts verticales, bottom sheets, navbar con hamburguesa
- `≥ md` → tablet/desktop: layouts side-by-side actuales

Patrones de UI por tipo de página:
1. **Mapa primario + drawer inferior** — PublicMapPage, ProjectDetailPage
2. **Tabs Form ↔ Mapa** — AddObservationPage
3. **Pila vertical** — listados y formularios sin mapa

---

## Fase 1 — Cimientos (1-2 h) ✅
- [x] Verificar/añadir `<meta name="viewport">` con `viewport-fit=cover` en `index.html`
- [x] Crear `src/hooks/use-is-mobile.ts` con `useIsMobile()` (matchMedia `max-width: 767px`)
- [x] Verificar que `Sheet side="bottom"` de shadcn funciona como esperamos (añadido `max-h-[90dvh] rounded-t-xl` al primitive)

## Fase 2 — Navbar (2 h) ✅
- [x] En `< md`: ocultar nav links inline, mostrar botón hamburguesa que abre `Sheet side="left"`
- [x] Compactar idioma/campana/avatar a iconos en móvil
- [x] Tap targets ≥ 40px en móvil (h-10) → 36px en desktop (h-9)

## Fase 3 — ObservationPanel (2 h) ✅
- [x] `side="right"` en desktop, `side="bottom"` en móvil (via `useIsMobile`)
- [x] En móvil: altura `h-[75dvh]`, agarrador visual arriba, botón X
- [x] Navegador entre obs (chevrons) intacto en móvil (heredado del header)

## Fase 4 — ProjectDetailPage (3-4 h) ✅
- [x] En `< md`: sidebar `w-72` oculto, bottom sheet con info al tocar chip del nombre arriba
- [x] En `≥ md`: comportamiento actual
- [x] Back button flotante (top-left), chip nombre proyecto (top), FAB Add observation (bottom-right) en móvil

## Fase 5 — AddObservationPage (3-4 h) ✅
- [x] En `< md`: Tabs `[ Form | Map ]` (shadcn `Tabs`) con `forceMount` para preservar estado
- [x] Auto-switch a Form al seleccionar ubicación en Map
- [x] Botón submit sticky footer dentro de la pestaña Form
- [x] Alert de ubicación → tap abre tab Map en móvil
- [x] En `≥ md`: layout actual side-by-side

## Fase 6 — PublicMapPage (2 h) ✅
- [x] Logo + nombre proyecto: en `< md` ocultar lista de organizaciones (hidden md:flex)
- [x] Top bar con `max-w-[calc(100%-2rem)]` + `truncate` para nombres largos
- [x] Idioma + atribución: `bottom-4 md:bottom-8` (más arriba en móvil para no colisionar con system gestures)
- [x] Panel hereda Fase 3

## Fase 7 — Formularios (2-3 h) ✅
- [x] LoginPage + RegisterPage: logo `h-24 md:h-48`, padding `p-6 md:p-16`, title `text-2xl md:text-4xl`
- [x] CreateProjectPage: header en columna en móvil, step indicators con `overflow-x-auto`, padding `p-4 md:p-6`
- [x] ProjectFormPage: header con `overflow-x-auto`, padding `px-3 md:px-6`, tabs scrollables
- [x] DeleteAccountPage, Profile: ya tenían `max-w-3xl mx-auto` y se ven OK

## Fase 8 — Listados (2 h) ✅
- [x] Grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` ya existían
- [x] Filtros con `flex-wrap`, selects más compactos en móvil (`w-32 md:w-40`)
- [x] Padding `px-4 md:px-6` en toolbars y contenido
- [x] Botones "Nuevo X" muestran solo icono en móvil (`hidden sm:inline` en label)
- [x] Top bar con `overflow-x-auto` para tabs largas

## Fase 9 — Páginas estáticas (1 h) ✅
- [x] AboutPage: padding `px-4 md:px-6` en todas las secciones
- [x] PrivacyPolicy + TermsOfUse: `px-4 md:px-6 py-8 md:py-12`
- [x] Logo grande hidden en móvil ya estaba (`hidden md:flex`)
- [x] AboutPage grids ya con `md:grid-cols-2` (apilan en móvil)

## Fase 10 — Refinamiento (1-2 h) ✅
- [x] Satellite toggles bumped a `h-10 w-10` en móvil (eran 29px)
- [x] Reposicionado satellite toggle a `top-[180px]` en móvil (más espacio del chip arriba)
- [x] Tap targets ≥ 40px en navbar, FAB, back button mobile, satellite toggle
- [x] Build production y type check OK
- [ ] QA manual en navegador (pendiente del usuario)
- [ ] Alternativa táctil para tooltips de hover (no crítico — tooltips se muestran con mousemove, en móvil no aplica)

---

## Prioridad sugerida si no se hace todo de golpe

1. **Fases 1+2+3** (~5-6h) — base usable en móvil
2. **Fases 4+5+6** (~8-10h) — páginas de mapa (core de Geonity)
3. **Fases 7+8+9+10** (~6-8h) — pulido del resto

**Total estimado: 20-25 h**
