# Teknoba

Aplicación de tareas personales con ASP.NET MVC, .NET Framework, jQuery y Ajax.


## Estado actual

 crear tareas por Ajax, consultar un listado con identificadores y estados (más recientes primero), y ver un resumen de total, pendientes y completadas calculado en el servidor. Al cargar se muestran guiones hasta recibir una respuesta válida. Si una actualización falla, se conservan los últimos datos con una advertencia de posible desactualización.

Cada tarea permite marcarse como completada o volver a pendiente sin recargar la página. El servidor valida el identificador, el estado solicitado y la versión de la tarea; rechaza datos inválidos, tareas ajenas a la sesión y cambios basados en una versión antigua. Después de guardar, se consulta de nuevo el listado y el resumen. 

El botón Editar abre un formulario con el título y la descripción actuales. Guardar cambios valida los mismos límites que la creación y conserva el identificador, la fecha y el estado. Cancelar edición descarta el borrador sin enviar cambios al servidor. Si otra pestaña modificó la tarea, se rechaza el guardado y se conserva el texto para poder revisarlo antes de cancelar y actualizar. Solo se abre una edición a la vez.

Eliminar solicita confirmación antes de enviar la petición. Cancelar conserva la tarea. El servidor verifica la sesión y la versión antes de eliminar. Los identificadores no se reutilizan dentro de una sesión, aunque se borre toda la lista.

El selector Mostrar tareas permite consultar todas, pendientes o completadas mediante Ajax. El filtro se conserva al crear, editar, cambiar el estado o eliminar. El resumen superior siempre cuenta todas las tareas; el mensaje del listado indica cuántas cumplen el filtro. Consultar o recargar no crea tareas adicionales. Al recargar la página, el filtro vuelve a Todas.

## Requisitos


Se utilizan ASP.NET MVC 5.3.0 y jQuery 3.7.1 completo. Las dependencias NuGet resueltas quedan fijadas en `NexoTareas/packages.lock.json`; el script restaura en modo bloqueado. jQuery está incluido localmente con su licencia.

## Ejecutar

 PowerShell en la carpeta que contiene la solución y ejecutar:

```powershell
.\INICIAR.ps1
```


```powershell
.\INICIAR.ps1 -Puerto 51842
```

Para restaurar y compilar sin iniciar el servidor:

```powershell
.\INICIAR.ps1 -SoloCompilar
```

## Organización del código

- `Models/Tarea.cs`: datos de una tarea.
- `Services/AlmacenTareasSesion.cs`: recuperación de la lista de la sesión actual, sin una lista estática compartida.
- `Controllers/TareasController.cs`: página inicial y consulta JSON protegida con token antifalsificación.
- `Views/`: vistas Razor y diseño compartido.
- `Scripts/app.js`: petición Ajax y mensajes de consulta.
- `Content/site.css`: presentación adaptable y foco de teclado.
