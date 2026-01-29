# Olympus Platform v5.0 Stable (Analítica Organizacional basada en Metadatos)

Creado por Eduardo Restrepo (GreenX)

  eduardo.restrepo@gmail.com 
  
  eduardo.restrepo@protonmail.ch
  
## 1. Visión general

**OLYMPUS** es una plataforma de inteligencia organizacional diseñada para analizar el funcionamiento real de una organización utilizando **exclusivamente metadatos agregados** de **Microsoft 365 (Exchange y Teams)**.

Permite comprender de forma visual y explicable:

- Influencia entre personas
- Balance de poder organizacional
- Uso y dependencia de canales de comunicación
- Evolución de la actividad operativa
- Evolución del tono organizacional
- Redes de influencia e influenciadores
- Capacidad real de decisión por rol y comportamiento
- Silos de trabajo e información
- Comprender como fluye la información y la red de contactos corporativos
- **NUEVO**: Visualización por Silos (Unidades Organizacionales) y Países
- **NUEVO**: Detección de "Influencia Opositiva" (Escalada Estratégica)

### Privacidad por diseño
- **NO** se analiza contenido
- **NO** se leen emails, mensajes ni textos
- **SOLO** se usan metadatos agregados
- Cumple principios de minimización y privacidad

## 2. Instrucciones de Despliegue

La plataforma utiliza **Docker** para garantizar un entorno reproducible y aislado.

### Requisitos Previos
- Docker y Docker Compose instalados en el sistema.

### 2.1 Configuración de Microsoft 365 (Azure AD)

Para conectar Olympus a tu organización, necesitas registrar una aplicación:

1.  Ir a [Azure Portal > App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps).
2.  Crear nueva app "Olympus Analytics".
3.  Generar un **Client Secret** y copiar el **Value**.
4.  Asignar Permisos de Aplicación (**Application Permissions**) en **Microsoft Graph**:
    - `Mail.ReadBasic.All` (Solo cabeceras, sin cuerpo).
    - `User.Read.All` (Lista de empleados).
    - `CallRecords.Read.All` (Metadatos de llamadas Teams).
    - **IMPORTANTE**: Otorgar "Admin Consent" para tu organización.
5.  Configurar las credenciales en el archivo `.env` del backend (ver `.env.example`).

### 2.2 Configuración de Filtros de Usuarios

Puedes controlar qué usuarios se analizan ajustando las variables en el archivo de configuración **`backend/.env`**.
*(Nota: Si este archivo no existe, duplica `backend/.env.example` y renómbralo a `.env`)*.

#### Caso A: Probar con un grupo reducido (Recomendado al inicio)
Para analizar solo a 4 o 5 personas específicas sin afectar al resto:
1.  Establece `INGESTION_MODE=TEST`.
2.  Agrega los correos en `TEST_TARGET_USERS` separados por comas (sin espacios).
    ```dotenv
    INGESTION_MODE=TEST
    TEST_TARGET_USERS=ceo@empresa.com,gerente@empresa.com,asistente@empresa.com
    ```

#### Caso B: Analizar toda la organización
Cuando estés listo para producción:
1.  Cambia a `INGESTION_MODE=FULL`.
    ```dotenv
    INGESTION_MODE=FULL
    ```
    *(En este modo `TEST_TARGET_USERS` será ignorado)*.

#### Caso C: Excluir usuarios (Lista Negra)
Para evitar leen metadatos de cuentas de servicio, administradores o bots (funciona en ambos modos):
1.  Agrega los correos en `EXCLUDED_USERS`.
    ```dotenv
    EXCLUDED_USERS=admin@empresa.com,soporte@empresa.com,noreply@empresa.com
    ```

### 2.3 Configuración de Scoring de Influencia Unificado

Olympus calcula la influencia combinando métricas de **Email** y **Teams**. Puedes ajustar los pesos según la cultura de comunicación de tu organización:

```dotenv
# Los pesos deben sumar 1.0
INFLUENCE_WEIGHT_EMAIL=0.6    # 60% peso a Email
INFLUENCE_WEIGHT_TEAMS=0.4    # 40% peso a Teams
```

**¿Cómo elegir los pesos?**
- **Organizaciones tradicionales** (más email): `EMAIL=0.7, TEAMS=0.3`
- **Organizaciones ágiles** (más reuniones): `EMAIL=0.5, TEAMS=0.5`
- **Equipos remotos** (muy colaborativos): `EMAIL=0.4, TEAMS=0.6`

### 2.4 Período de Análisis de Datos

Configura cuántos días hacia atrás se analizarán los datos de Email y Teams:

```dotenv
# Período de análisis (en días)
EMAIL_LOOKBACK_DAYS=30    # Emails de los últimos 30 días
TEAMS_LOOKBACK_DAYS=30    # Reuniones/llamadas de los últimos 30 días
```

**Recomendaciones:**
- **Mínimo**: 15 días (para análisis significativo)
- **Óptimo**: 30 días (balance entre profundidad y rendimiento)
- **Extendido**: 60-90 días (para análisis de tendencias a largo plazo)

> ⚠️ **Nota**: El sistema aplicará automáticamente un mínimo de 15 días aunque se configure un valor menor.

**Período de análisis de Teams:**
```dotenv
TEAMS_LOOKBACK_DAYS=30  # Analizar últimos 30 días de llamadas/reuniones
```


### Instalación y Ejecución

1. Clonar este repositorio.
2. Ejecutar el siguiente comando en la raíz del proyecto para construir y levantar los servicios:

   bash
   docker compose up --build
   

3. Acceder a los servicios:
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000 (o el puerto asignado)

### 2.5 Lógica de Cálculo de Scoring

La puntuación de influencia (0-100) **NO se basa en percentiles** (comparación con otros), sino en el cumplimiento de **Umbrales de Referencia (Benchmarks)** predefinidos. Esto garantiza que el score sea objetivo y no dependa del desempeño de los demás.

**Fórmula General:**
`Score Unificado = (Score Email × 0.6) + (Score Teams × 0.4)`

**Umbrales de Referencia (Benchmark = 100 puntos):**

1.  **Email (Peso 60%)**
    *   **Volumen:** Se requieren **500 emails/mes** para obtener el puntaje máximo en volumen.
    *   **Respuesta:** Se penaliza el tiempo de respuesta (Ideal: < 1 hora).

2.  **Teams (Peso 40%)**
    *   **Frecuencia:** Se requieren **50 reuniones/mes** para el puntaje máximo de frecuencia.
    *   **Liderazgo:** Se otorgan puntos extra por ser organizador.
    *   **Audiencia:** Se valora el número de participantes promedio.

> **Ejemplo:** Si un usuario envía **425 emails**, su score de volumen será `(425 / 500) * 100 = 85 pts`.

## 3. Stack Tecnológico

### Backend
- **Lenguaje:** PHP 8.2
- **Framework:** Symfony 6/7 (Perfil API)
- **Base de Datos:** PostgreSQL
- **Persistencia:** SQL Nativo / PDO (Sin ORM pesado)
- **Data Seeding:** Generación automática de datos de prueba al inicio.

### Frontend
- **Biblioteca:** React 18
- **Build System:** Vite
- **Estilos:** Tailwind CSS / CSS Modules
- **Visualización:** Chart.js, D3.js

## 4. Endpoints de la API

Los siguientes endpoints están disponibles para alimentar los dashboards:

### `GET /api/top-influencers`
Ranking de usuarios más influyentes con **scoring unificado** (Email + Teams).

**Respuesta incluye:**
- `unified_score`: Score combinado (0-100)
- `email_score`: Score basado en volumen y tiempo de respuesta de emails
- `teams_score`: Score basado en frecuencia, audiencia y liderazgo en reuniones
- `dominant_channel`: Canal principal de influencia ('Email' o 'Teams')
- `email_metrics`: Desglose de métricas de correo
- `teams_metrics`: Desglose de métricas de Teams (reuniones, participantes, duración, etc.)

### Otros Endpoints
- `GET /api/balance-power` : Distribución de poder organizacional (por badge/rol).
- `GET /api/channel-totals` : Volumen de uso por canal de comunicación. **Nota**: Los datos de Teams se segregan en dos categorías:
  - **Teams: Llamadas 1-a-1**: Llamadas directas entre dos personas (`peerToPeer`)
  - **Teams: Reuniones**: Llamadas grupales y reuniones (`groupCall`)
- `GET /api/network-pulse` : **Pulso de Red**. Mide la "salud vital" de la comunicación. Evalúa la densidad de conexiones, la agilidad de respuesta y la estabilidad de los flujos de información en tiempo real. Un pulso alto indica una organización altamente conectada y dinámica.
- `GET /api/tone-index` : **Índice de Tono Organizacional**. Representa el "clima" o "vibración" de las interacciones. Se calcula a partir de patrones de metadatos como la urgencia, la consistencia en las respuestas y los horarios de interacción, permitiendo inferir niveles de compromiso o presión sin leer el contenido.
- `GET /api/influence-graph`

### Sistema de Badges (Gamificación)
La plataforma asigna badges automáticos basados en el ranking de influencia unificado:
- ♚ **King / Reina**: Top #1 (El más influyente).
- ♛ **Queen / Alfil**: Top #2 - #3.
- ♜ **Rook (Torre)**: Top #4 - #10 (Hubs de comunicación).
- ♗ **Bishop (Alfil)**: Top 15% (Influencia técnica/especializada).
- ♞ **Knight (Caballo)**: Top 30% (Agilidad).
- ♙ **Pawn (Peón)**: Resto de la organización (Operativo).

### `GET /api/influence-graph`
Estructura de red (nodos y aristas) para visualización D3.js. Soporta filtrado por pesos y búsqueda interactiva.

### `GET /api/about`
Metadatos del sistema y versión (v5.0 Stable).

## 5. Características Avanzadas (Nuevas)

### 5.1 Perfil Radar de Influencia
Análisis multidimensional de cada actor. Al hacer clic en un usuario, se despliega un gráfico radar que evalúa:
- **Conectividad:** Score unificado de influencia.
- **Velocidad:** Agilidad de respuesta histórica.
- **Volumen:** Densidad de interacciones por email.
- **Impacto Teams:** Nivel de actividad en entornos colaborativos.
- **Liderazgo:** Capacidad detectada mediante la organización de reuniones.

### 5.2 Modo Anonimización (Privacy-Plus)
Interruptor global que permite ofuscar la identidad de todos los actores en tiempo real. Ideal para presentaciones ejecutivas o análisis de red donde la identidad individual no es el foco principal, convirtiendo nombres reales en identificadores genéricos (ej: "Actor 7").

### 5.3 Simulación de "Single Point of Failure" (Bajas)
Herramienta interactiva dentro del grafo de red que permite simular la salida de un actor clave.
- **Funcionamiento:** Al "eliminar" un nodo en modo simulación, el sistema visualiza instantáneamente cómo se debilitan las conexiones y qué sub-nodos quedan aislados, permitiendo identificar dependencias críticas.

### 5.4 Nuevas Vistas de Análisis
- **Vista Silos (Departamentos):** Agrupa y colorea el grafo según la Unidad Organizacional, revelando si los departamentos colaboran entre sí o están aislados.
- **Vista Países:** Permite visualizar la colaboración transfronteriza y detectar si las sedes geográficas operan como islas.
- **Vista Influencia Opositiva:** Destaca en rojo ("Hotspots") a los actores que presentan un alto índice de escalada (CC excesivo a superiores), permitiendo identificar fricciones políticas o cuellos de botella en la toma de decisiones.

## 6. Principios de Proyecto

- **Código Explicable:** Evitar "magia" o abstracciones innecesarias.
- **Estabilidad:** UI robusta y endpoints siempre responsivos.
- **Simplicidad:** Soluciones directas y mantenibles.

## 6. Privacidad y Datos (Transparency Note)

Olympus está diseñado para ser "Privacy-First". A continuación se detalla técnicamente qué datos obtiene de la API de Microsoft:

### Lo que SÍ leemos:

#### Datos de Identidad
- **Identidad**: Nombre, Correo, Departamento, Job Title.

#### Metadatos de Correos (Exchange)
- **Headers Limitados** (usando `Mail.ReadBasic.All`):
    - `Sender` / `From`: Quién envía.
    - `ToRecipients` / `CcRecipients`: Quién recibe.
    - `SentDateTime` / `ReceivedDateTime`: Cuándo.
    - `Subject`: Asunto (para análisis de contexto general, opcionalmente ofuscable).
    - `Importance`: Nivel de prioridad del mensaje.
- **Interacciones**: Conteo de mensajes y frecuencia.

#### Metadatos de Teams (Llamadas y Reuniones)
- **Información de Participación** (usando `CallRecords.Read.All`):
    - **Participantes**: Lista de quién participó en cada llamada/reunión.
    - **Organizador**: Quién organizó la reunión.
    - **Timestamps**: Hora de inicio y fin (`startDateTime`, `endDateTime`).
    - **Duración**: Tiempo total de la llamada/reunión (calculado).
- **Tipo de Llamada**:
    - `groupCall`: Reuniones grupales.
    - `peerToPeer`: Llamadas 1-a-1.
- **Modalidades Usadas**:
    - `audio`: Si se usó audio.
    - `video`: Si se usó video.
    - `screenSharing`: Si se compartió pantalla.
- **Métricas Técnicas** (para troubleshooting de calidad):
    - Calidad de red (latencia, jitter, packet loss).
    - Dispositivos utilizados (desktop, mobile, web).
    - Direcciones IP (solo para diagnóstico técnico).

### Lo que NO leemos:

#### Email (Técnicamente imposible con `Mail.ReadBasic.All`)
- ❌ **Cuerpo del correo (`Body`)**: El contenido del mensaje es invisible para la aplicación.
- ❌ **Adjuntos**: No se descargan ni analizan archivos.

#### Teams (No accesible con `CallRecords.Read.All`)
- ❌ **Contenido de Chats**: No se leen mensajes de Teams (requeriría `Chat.Read.All` - más invasivo).
- ❌ **Transcripciones**: No se accede a transcripciones de reuniones.
- ❌ **Grabaciones**: No se descargan ni analizan grabaciones de audio/video.
- ❌ **Archivos Compartidos**: No se accede a archivos compartidos en chats o reuniones.
- ❌ **Contenido de Presentaciones**: No se analiza el contenido de pantallas compartidas.

### Período de Retención

- **Call Records de Microsoft**: Se mantienen 30 días en Microsoft Graph API.
- **Olympus**: Configurable vía `EMAIL_LOOKBACK_DAYS` y `TEAMS_LOOKBACK_DAYS` (mínimo 15 días, por defecto 15 días).

### Cumplimiento y Privacidad

- ✅ **GDPR Compliant**: Solo metadatos agregados, sin contenido.
- ✅ **Minimización de Datos**: Solo se recopila lo necesario para análisis de influencia.
- ✅ **Transparencia**: Este documento detalla exactamente qué se lee y qué no.
- ✅ **Consentimiento Administrativo**: Requiere aprobación explícita del administrador de Microsoft 365.

> ⚠️ **Nota Importante**: Aunque solo se analizan metadatos, la información sobre quién se comunica con quién y cuándo puede ser sensible. Asegúrate de cumplir con las regulaciones locales de privacidad y obtener las aprobaciones necesarias antes de desplegar en producción.

