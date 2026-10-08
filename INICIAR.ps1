param([ValidateRange(1024,65535)][int]$Puerto = 51841, [switch]$SoloCompilar)
$ErrorActionPreference = 'Stop'
$proyectoNexo = Join-Path $PSScriptRoot 'NexoTareas\NexoTareas.csproj'
$vswhereNexo = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (!(Test-Path -LiteralPath $vswhereNexo)) { throw 'Instale Visual Studio con Desarrollo de ASP.NET y web y el paquete de destino de .NET Framework 4.8.' }
$msbuildNexo = & $vswhereNexo -latest -products '*' -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
if (!$msbuildNexo) { throw 'No se encontro MSBuild en Visual Studio.' }
& $msbuildNexo $proyectoNexo /restore /t:Build /p:Configuration=Debug /p:RestoreLockedMode=true /verbosity:minimal /nologo
if ($LASTEXITCODE -ne 0) { throw 'No se pudo restaurar o compilar. Revise los mensajes anteriores.' }
if ($SoloCompilar) { return }
$iisNexo = Join-Path $env:ProgramFiles 'IIS Express\iisexpress.exe'
if (!(Test-Path -LiteralPath $iisNexo)) { throw 'No se encontro IIS Express.' }
$ocupadoNexo = Get-NetTCPConnection -State Listen -LocalPort $Puerto -ErrorAction SilentlyContinue
if ($ocupadoNexo) { throw "El puerto $Puerto ya esta ocupado. Revise la instancia abierta o use .\INICIAR.ps1 -Puerto 51842." }
Write-Host "Abra http://localhost:$Puerto/ . Para detener el servidor presione Ctrl+C en esta terminal."
& $iisNexo "/path:$(Join-Path $PSScriptRoot 'NexoTareas')" "/port:$Puerto" /systray:false
if ($LASTEXITCODE -ne 0) { throw 'IIS Express no pudo iniciar o termino con un error.' }
