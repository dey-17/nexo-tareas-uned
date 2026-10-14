# Teknoba

Aplicación de tareas personales con ASP.NET MVC, .NET Framework, jQuery y Ajax.

Identidad visual: verdes y grises con tipografía Trebuchet MS (alternativas locales Verdana y sans-serif). No requiere descargar fuentes externas. El nombre técnico de la solución y la dirección del repositorio se conservan para no romper las rutas de ejecución ni los enlaces existentes.

## Estado actual

Permite crear tareas por Ajax, consultar un listado con identificadores y estados (más recientes primero), y ver un resumen de total, pendientes y completadas calculado en el servidor. Al cargar se muestran guiones hasta recibir una respuesta válida. Si una actualización falla, se conservan los últimos datos con una advertencia de posible desactualización; no se reemplazan por ceros.

Título obligatorio (1–100 caracteres) y descripción obligatoria (1–1000), sin aceptar solo espacios. Se validan en cliente y servidor y se recortan los espacios exteriores. Cada tarea nueva comienza pendiente. Las peticiones requieren token antifalsificación. El formulario conserva su contenido si no se confirma el guardado; conviene consultar antes de reintentar para evitar duplicados por una interrupción de red.

Cada tarea permite marcarse como completada o volver a pendiente sin recargar la página. El servidor valida el identificador, el estado solicitado y la versión de la tarea; rechaza datos inválidos, tareas ajenas a la sesión y cambios basados en una versión antigua. Después de guardar, se consulta de nuevo el listado y el resumen. Si la conexión falla, se debe actualizar la lista para comprobar el resultado antes de reintentar.

Todavía no están implementados editar, eliminar ni filtros. Consultar o recargar no crea tareas adicionales.

## Requisitos

- Windows y Visual Studio 2022 con la carga **Desarrollo de ASP.NET y web**.
- Paquete de destino de .NET Framework 4.8 e IIS Express.
- Conexión a NuGet.org para restaurar las dependencias la primera vez.
- Navegador con JavaScript y cookies habilitados.

Se utilizan ASP.NET MVC 5.3.0 y jQuery 3.7.1 completo. Las dependencias NuGet resueltas quedan fijadas en `NexoTareas/packages.lock.json`; el script restaura en modo bloqueado. jQuery está incluido localmente con su licencia.

## Ejecutar

1. Descargar o clonar este repositorio y extraerlo si se usa Download ZIP.
2. Abrir `NexoTareas.sln` en Visual Studio, restaurar paquetes y ejecutar con F5 o Ctrl+F5.
3. Como alternativa, abrir PowerShell en la carpeta que contiene la solución y ejecutar:

```powershell
.\INICIAR.ps1
```

La dirección por defecto es **http://localhost:51841/**. Ctrl+C en la terminal detiene IIS Express. Para iniciar de nuevo se ejecuta el mismo comando. Si el puerto está ocupado, se puede revisar la instancia existente o elegir otro:

```powershell
.\INICIAR.ps1 -Puerto 51842
```

Para restaurar y compilar sin iniciar el servidor:

```powershell
.\INICIAR.ps1 -SoloCompilar
```

VS Code sirve como editor y terminal si los requisitos anteriores están instalados. Live Server y `dotnet run` no sustituyen IIS Express en este proyecto clásico de ASP.NET MVC.

## Estructura

- `Models/Tarea.cs`: datos de una tarea.
- `Services/AlmacenTareasSesion.cs`: recuperación de la lista de la sesión actual, sin una lista estática compartida.
- `Controllers/TareasController.cs`: página inicial y consulta JSON protegida con token antifalsificación.
- `Views/`: vistas Razor y diseño compartido.
- `Scripts/app.js`: petición Ajax y mensajes de consulta.
- `Content/site.css`: presentación adaptable y foco de teclado.

## Estado y límites

Las tareas se almacenan únicamente en memoria del servidor mediante Session InProc con 30 minutos de inactividad. No hay base de datos, persistencia en archivos ni almacenamiento de tareas en LocalStorage. La lista desaparece al expirar la sesión o al reiniciar el proceso.

Las pestañas que comparten la cookie de sesión pueden compartir la lista. Una sesión independiente tiene su propia lista. Session no representa una cuenta de usuario ni autentica a la persona. El prototipo no tiene inicio de sesión, sincronización entre dispositivos ni recuperación de datos. No se deben usar datos confidenciales.

La configuración HTTP está destinada a la demostración local; no constituye una configuración de despliegue público en producción. El repositorio público permite descargar código, no ejecutar la aplicación en GitHub.
