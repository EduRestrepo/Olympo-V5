# Guía de Implementación y Actualización - Olympus v5.0 Stable

## Resumen de Cambios (Changelog)
La versión 5.1 introduce capacidades avanzadas de analítica predictiva y benchmarking. Esta actualización requiere cambios en el esquema de base de datos.

---

## 🚀 Instrucciones de Actualización (Desde v5.0)

### 1. Actualizar Código Fuente
```bash
git pull origin main
```

### 2. Actualizar Contenedores
Es necesario reconstruir el frontend para incluir los nuevos componentes de UI y reiniciar el backend para cargar los nuevos servicios.

```bash
docker-compose down
docker-compose up -d --build
```

### 3. Migración de Base de Datos (CRÍTICO)
La v5.1 añade tablas para `churn_risk_scores`, `burnout_indicators`, etc.
Hemos incluido un script de corrección automática para aplicar los cambios de esquema y constrains necesarios.

**Ejecutar el script de migración:**
```bash
docker-compose exec backend php scripts/run_analytics_fixes.php
```

> **Verificación**: Si el script se ejecuta correctamente, verá el mensaje "All analytics fixes applied successfully".

### 4. Verificar Permisos
Asegúrese de que los directorios de logs tengan permisos de escritura:
```bash
chmod -R 777 backend/logs
```

---

## 🛠️ Solución de Problemas Comunes

### Error 500 en "Inteligencia Predictiva"
*   **Causa**: Falta de columnas en la tabla `churn_risk_scores` o error de casting de fechas en PostgreSQL.
*   **Solución**: Ejecute el script `run_analytics_fixes.php` mencionado en el paso 3. Este script añade las columnas faltantes (`engagement_drop`, etc.) y aplica los parches de código necesarios.

### Gráficos Vacíos en Benchmark
*   **Causa**: La tabla `department_benchmarks` o `teams_call_records` puede estar vacía si no se ha ejecutado el proceso de cálculo nocturno.
*   **Solución**: 
    1. Vaya a `Configuración -> Sembrar Base de Datos`.
    2. Haga clic en "Recalcular Métricas" para forzar la generación de datos.

### Error de Conexión con Microsoft Graph
*   Verifique que las credenciales en el archivo `.env` (`CLIENT_ID`, `CLIENT_SECRET`) no hayan expirado en Azure Portal.

---

## 📞 Soporte
Para asistencia técnica directa, contacte al equipo de desarrollo en [eduardo.restrepo@gmail.com].
