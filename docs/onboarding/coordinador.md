# Bienvenido/a, coordinador/a

Esta guía le pone a trabajar en el panel de coordinación de HOS en unos 10
minutos. Todo lo descrito aquí existe y funciona hoy.

## 1. Su acceso

1. Un administrador agrega su correo a la lista de coordinadores
   (variable `HOS_COORDINATOR_EMAILS`; es una lista cerrada por invitación —
   si su correo no está, nadie entra "por defecto").
2. Entre en `/coordination` e inicie sesión con su correo y contraseña.
3. ¿Olvidó su contraseña? Use "¿Olvidó su contraseña?" y siga el enlace que
   llega a su correo (`/reset-password`).

**Importante:** cada acción que usted realiza queda registrada a su nombre en
la bitácora de auditoría. Eso protege a las familias y también lo protege a
usted: nadie puede atribuirle algo que no hizo.

## 2. El panel en un minuto

- **Métricas** (arriba): necesidades abiertas, críticas, camas libres, sitios.
- **Necesidades**: lo que la gente y los sitios piden. Filtros por categoría
  (Rescate, Agua, Comida…) y "Solo críticas".
- **Puntos de ayuda**: acopios, refugios, atención médica, internet/carga,
  mascotas. Con su capacidad (camas) cuando aplica.
- **Suministros**: lo que las organizaciones ofrecen. El sistema sugiere
  cruces suministro↔necesidad — son SOLO sugerencias; siempre decide una
  persona.
- **Mapa**: círculos numerados = necesidades por distrito; puntos pequeños =
  reportes con ubicación exacta; letras de colores = puntos de ayuda.
  "Pantalla completa" abre el mapa de operaciones (`/coordination/mapa`),
  pensado para un monitor grande en un centro de operaciones.

La primera vez, el tour guiado ("¿Cómo funciona?") recorre esto en pantalla.

## 3. El ciclo de vida honesto de una necesidad

```
abierta ──claim──► comprometida ──receive──► recibida (final)
   └──────────────cancel──────────────────► cancelada (final)
```

- **Comprometer (claim)**: una organización se compromete a cubrirla.
- **Recibida (receive)**: SOLO el sitio que pidió confirma que llegó de
  verdad. Nunca lo marca quien la lleva, nunca es automático. Esta es la
  regla más importante del panel: el tablero nunca dice "resuelto" si nadie
  lo confirmó en el sitio.
- **Cancelar**: retira una necesidad sin fingir que se cubrió.

## 4. Frescura: desconfíe de lo viejo

Cada tarjeta muestra "actualizado hace X". Un dato de hace 6+ horas se marca
como envejecido; 24+ horas, obsoleto. Si un sitio no confirma su estado, esa
etiqueta es la señal para llamar antes de despachar nada.

En cada tarjeta de sitio: **Confirmar operativo / Marcar cerrado / Reabrir**
mantienen viva esa señal. Confirme el estado de sus sitios al menos una vez
por turno.

## 5. De dónde salen los datos

Los datos iniciales provienen del mapa comunitario público caracasayuda.com;
durante la primera semana se sincronizan cada noche (11:45 pm Caracas).
**Sus ediciones siempre ganan**: cualquier registro que usted corrija o cree
directamente en HOS nunca es sobrescrito por la sincronización. La marca
"Sin verificar en el origen" viene del propio mapa fuente.

## 6. Qué NO hace este panel (todavía)

- No es público: solo coordinadores ven esto.
- No despacha voluntarios ni asigna tareas (decisión pendiente de la mesa).
- No recibe reportes del público directamente (la compuerta de ingreso con
  clasificación automática está diseñada pero cerrada hasta que se apruebe).

## 7. Casos de protección: niños solos, violencia, abusos — LEA ESTO

Estos casos existen en toda emergencia y este panel NO es el lugar para sus
detalles. Regla general: **refiera a especialistas; escriba lo mínimo.**

1. **Niño/a solo/a (no acompañado):** manténgalo con un adulto de confianza
   identificado y registre el caso por el flujo de reunificación (reporte de
   persona encontrada), que ya existe y protege esos datos. NUNCA publique la
   ubicación de un menor solo en el tablero de necesidades ni en un aviso.
2. **Violencia sexual:** NO escriba nombres, detalles ni relatos en HOS — ni
   en notas, ni en avisos. Su papel es conectar a la persona (si ella lo
   quiere) con servicios especializados de salud y apoyo. La confidencialidad
   y el consentimiento de la sobreviviente mandan.
3. **Abuso policial o de autoridades:** NO lo registre en HOS. Este sistema
   corre en infraestructura que puede ser exigida legalmente; un registro
   aquí puede convertirse en una lista de denunciantes. Refiéralo a una
   organización de derechos humanos que documente con protocolos seguros.
4. **En ningún caso** escriba nombres de víctimas o presuntos agresores en
   las notas de una necesidad, un sitio o un aviso.

¿Por qué tan estricto? Los datos de protección son los más peligrosos que un
sistema puede guardar: mal manejados, dañan exactamente a quienes queremos
proteger. Hay una propuesta formal en revisión (HOS-2026-016) para definir
qué puede registrar HOS de forma segura; hasta que se apruebe, aplica esta
guía.
