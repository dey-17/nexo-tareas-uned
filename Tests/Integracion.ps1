param([string]$BaseUrl = 'http://localhost:51841')
$ErrorActionPreference = 'Stop'
$page = Invoke-WebRequest "$BaseUrl/" -UseBasicParsing -SessionVariable client
$token = [regex]::Match($page.Content, 'name="__RequestVerificationToken" type="hidden" value="([^"]+)"').Groups[1].Value
if (!$token) { throw 'No se encontró el token antifalsificación.' }
function Post($action, $data) {
    $data.__RequestVerificationToken = $token
    Invoke-RestMethod "$BaseUrl/Tareas/$action" -Method Post -WebSession $client -Body $data
}
function Assert($condition, $message) { if (!$condition) { throw $message } }
function Rechaza($action, $data, $status) {
    try { Post $action $data | Out-Null; throw 'Solicitud inválida aceptada.' }
    catch { if (!$_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne $status) { throw } }
}
Assert ((Post 'Consultar' @{}).Total -eq 0) 'La sesión debe empezar vacía.'
$a = (Post 'Crear' @{titulo='  Comprar repuestos  ';descripcion='  Revisar existencias  '}).Tarea
$b = (Post 'Crear' @{titulo='Revisar equipos';descripcion='Inventario de oficina'}).Tarea
Assert ($a.Titulo -eq 'Comprar repuestos') 'No normalizó espacios.'
Rechaza 'Crear' @{titulo=' ';descripcion='Texto'} 400
Rechaza 'Crear' @{titulo=('x'*101);descripcion='Texto'} 400
Rechaza 'Crear' @{titulo='Texto';descripcion=('x'*1001)} 400
$a = (Post 'CambiarEstado' @{id=$a.Id;version=$a.Version;completada='true'}).Tarea
$completed = Post 'Consultar' @{filtro='completadas'}
Assert ($completed.Total -eq 2 -and $completed.Pendientes -eq 1 -and $completed.Completadas -eq 1 -and $completed.Visibles -eq 1 -and $completed.Tareas[0].Id -eq $a.Id) 'Filtro de completadas incorrecto.'
$pending = Post 'Consultar' @{filtro='pendientes'}
Assert ($pending.Visibles -eq 1 -and $pending.Tareas[0].Id -eq $b.Id) 'Filtro de pendientes incorrecto.'
Rechaza 'Consultar' @{filtro='desconocido'} 400
$edited = (Post 'Editar' @{id=$a.Id;version=$a.Version;titulo='Repuestos revisados';descripcion='Descripción actualizada'}).Tarea
Assert ($edited.Id -eq $a.Id -and $edited.CreadaUtc -eq $a.CreadaUtc -and $edited.Completada) 'Editar alteró identidad, fecha o estado.'
Rechaza 'Editar' @{id=$a.Id;version=$a.Version;titulo='Antigua';descripcion='Texto'} 409
Rechaza 'Eliminar' @{id=$a.Id;version=$a.Version} 409
Rechaza 'Eliminar' @{id=99999;version=1} 404
Rechaza 'Eliminar' @{id=-1;version=1} 400
Rechaza 'Eliminar' @{id=$a.Id} 400
$a = (Post 'CambiarEstado' @{id=$edited.Id;version=$edited.Version;completada='false'}).Tarea
Assert ((Post 'Consultar' @{filtro='completadas'}).Visibles -eq 0) 'Filtro vacío incorrecto.'
Post 'Eliminar' @{id=$b.Id;version=$b.Version} | Out-Null
$c = (Post 'Crear' @{titulo='Nueva';descripcion='No reutiliza identificadores'}).Tarea
Assert ($c.Id -gt $b.Id) 'Identificador reutilizado al borrar la tarea más reciente.'
Rechaza 'Eliminar' @{id=$b.Id;version=$b.Version} 404
Post 'Eliminar' @{id=$a.Id;version=$a.Version} | Out-Null
Post 'Eliminar' @{id=$c.Id;version=$c.Version} | Out-Null
Assert ((Post 'Consultar' @{}).Total -eq 0) 'Eliminar no vació la lista.'
$d = (Post 'Crear' @{titulo='Última';descripcion='Sesión activa'}).Tarea
Assert ($d.Id -gt $c.Id) 'Identificador reutilizado después de vaciar la lista.'
1..3 | ForEach-Object { Assert ((Post 'Consultar' @{}).Total -eq 1) 'Consultar duplicó tareas.' }
$null = Invoke-WebRequest "$BaseUrl/" -WebSession $client -UseBasicParsing
Assert ((Post 'Consultar' @{}).Total -eq 1) 'Recargar alteró tareas.'
$other = Invoke-WebRequest "$BaseUrl/" -UseBasicParsing -SessionVariable otherClient
$otherToken = [regex]::Match($other.Content, 'name="__RequestVerificationToken" type="hidden" value="([^"]+)"').Groups[1].Value
try {
    Invoke-RestMethod "$BaseUrl/Tareas/Eliminar" -Method Post -WebSession $otherClient -Body @{id=$d.Id;version=$d.Version;__RequestVerificationToken=$otherToken} | Out-Null
    throw 'Eliminó una tarea ajena.'
} catch { if (!$_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 404) { throw } }
try {
    Invoke-RestMethod "$BaseUrl/Tareas/Eliminar" -Method Post -WebSession $client -Body @{id=$d.Id;version=$d.Version} | Out-Null
    throw 'Aceptó solicitud sin token.'
} catch { if (!$_.Exception.Response -or [int]$_.Exception.Response.StatusCode -lt 400) { throw } }
Assert ((Post 'Consultar' @{}).Total -eq 1) 'Rechazos alteraron tareas.'
Post 'Eliminar' @{id=$d.Id;version=$d.Version} | Out-Null
'PASS: CRUD, filtros, resumen, validaciones, conflictos, IDs, recarga, aislamiento y antifalsificación.'
