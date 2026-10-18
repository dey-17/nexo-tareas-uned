(function ($) {
    'use strict';
    $(function () {
        var panel = $('#panel-tareas'), ocupado = false, tieneConsulta = false;
        var guardando = false, formulario = $('#crear-tarea');
        var tareasActuales = [], edicion = null, editor = $('#editar-tarea');
        var filtroActual = 'todas';
        function representar(tareas) {
            tareasActuales = tareas;
            var lista = $('#tareas-creadas').empty();
            tareas.forEach(function (tarea) {
                var item = $('<li>').addClass('task-item');
                var cabecera = $('<div>').addClass('task-meta').appendTo(item);
                $('<span>').text('Tarea #' + tarea.Id).appendTo(cabecera);
                $('<span>').addClass('task-badge' + (tarea.Completada ? ' is-complete' : '')).text(tarea.Completada ? 'Completada' : 'Pendiente').appendTo(cabecera);
                $('<h3>').text(tarea.Titulo).appendTo(item);
                $('<p>').text(tarea.Descripcion).appendTo(item);
                $('<button>').attr({ type: 'button', 'data-id': tarea.Id, 'aria-label': 'Eliminar: ' + tarea.Titulo })
                    .addClass('button eliminar').text('Eliminar').appendTo(item);
                $('<button>').attr({ type: 'button', 'data-id': tarea.Id, 'aria-label': 'Editar: ' + tarea.Titulo })
                    .addClass('button editar').text('Editar').appendTo(item);
                $('<button>').attr({ type: 'button', 'data-id': tarea.Id, 'data-version': tarea.Version,
                    'data-completada': String(!tarea.Completada),
                    'aria-label': (tarea.Completada ? 'Marcar pendiente: ' : 'Completar: ') + tarea.Titulo
                }).addClass('button cambiar-estado').text(tarea.Completada ? 'Marcar pendiente' : 'Marcar completada').prop('disabled', ocupado || guardando).appendTo(item);
                item.appendTo(lista);
            });
        }
        $('#tareas-creadas').on('click', '.eliminar', function () {
            if (guardando || ocupado) return;
            $('#error-eliminar, #exito-eliminar').prop('hidden', true);
            var id = Number($(this).attr('data-id'));
            var tarea = tareasActuales.find(function (t) { return t.Id === id; });
            if (!tarea) return;
            if (edicion && edicion.id === id) {
                $('#error-eliminar').text('Guarda o cancela la edición de esta tarea antes de eliminarla.').prop('hidden', false);
                return;
            }
            if (!window.confirm('¿Eliminar la tarea "' + tarea.Titulo + '"? No se puede deshacer.')) return;
            guardando = true;
            $.ajax({
                url: panel.attr('data-eliminar-url'), method: 'POST', dataType: 'json', timeout: 15000,
                data: { id: tarea.Id, version: tarea.Version, __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true) { errorEliminar(); return; }
                $('#exito-eliminar').text('Tarea eliminada correctamente.').prop('hidden', false);
                consultar();
            }).fail(errorEliminar).always(function () { guardando = false; sincronizarControles(); });
            sincronizarControles();
        });
        function errorEliminar(xhr) {
            $('#error-eliminar').text(xhr && xhr.responseJSON && xhr.responseJSON.Mensaje || 'No se pudo confirmar la eliminación. Actualiza la lista antes de reintentar.').prop('hidden', false);
        }
        function sincronizarControles() {
            $('#actualizar, #guardar-tarea, .cambiar-estado, .editar, .eliminar, #filtro-tareas').prop('disabled', ocupado || guardando);
        }
        $(document).ajaxSend(sincronizarControles).ajaxComplete(sincronizarControles);
        $('#filtro-tareas').on('change', function () {
            if (guardando || ocupado) { $(this).val(filtroActual); return; }
            filtroActual = $(this).val();
            consultar();
        });
        $('#tareas-creadas').on('click', '.editar', function () {
            if (guardando || ocupado) return;
            if (edicion) { $('#editar-titulo').trigger('focus'); return; }
            var id = Number($(this).attr('data-id'));
            var tarea = tareasActuales.find(function (t) { return t.Id === id; });
            if (!tarea) return;
            edicion = { id: tarea.Id, version: tarea.Version };
            $('#titulo-edicion').text('Editar tarea #' + tarea.Id);
            $('#editar-titulo').val(tarea.Titulo).attr('aria-invalid', 'false');
            $('#editar-descripcion').val(tarea.Descripcion).attr('aria-invalid', 'false');
            $('#error-edicion, #exito-edicion').prop('hidden', true);
            editor.prop('hidden', false);
            $('#editar-titulo').trigger('focus');
        });
        $('#cancelar-edicion').on('click', function () {
            if (guardando) return;
            edicion = null;
            editor[0].reset();
            editor.prop('hidden', true);
            $('#exito-edicion').text('Edición cancelada. No se guardaron cambios.').prop('hidden', false);
            $('#actualizar').trigger('focus');
        });
        editor.on('submit', function (evento) {
            evento.preventDefault();
            if (!edicion || guardando || ocupado) return;
            var titulo = $('#editar-titulo').val().trim(), descripcion = $('#editar-descripcion').val().trim();
            var malTitulo = !titulo || titulo.length > 100, malDescripcion = !descripcion || descripcion.length > 1000;
            $('#editar-titulo').attr('aria-invalid', String(!!malTitulo));
            $('#editar-descripcion').attr('aria-invalid', String(!!malDescripcion));
            $('#error-edicion, #exito-edicion').prop('hidden', true);
            if (malTitulo || malDescripcion) {
                $('#error-edicion').text('Escribe un título de 1 a 100 caracteres y una descripción de 1 a 1000. No uses solo espacios.').prop('hidden', false);
                $(malTitulo ? '#editar-titulo' : '#editar-descripcion').trigger('focus');
                return;
            }
            guardando = true;
            editor.attr('aria-busy', 'true').find('input, textarea, button').prop('disabled', true);
            $('#actualizar, #guardar-tarea, .cambiar-estado, .editar').prop('disabled', true);
            $.ajax({
                url: editor.attr('action'), method: 'POST', dataType: 'json', timeout: 15000,
                data: { id: edicion.id, version: edicion.version, titulo: titulo, descripcion: descripcion,
                    __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true) { errorEdicion(); return; }
                edicion = null;
                editor[0].reset();
                editor.prop('hidden', true);
                $('#exito-edicion').text('Cambios guardados correctamente.').prop('hidden', false);
                consultar();
            }).fail(errorEdicion).always(function () {
                guardando = false;
                editor.attr('aria-busy', 'false').find('input, textarea, button').prop('disabled', false);
                $('#actualizar, #guardar-tarea, .cambiar-estado, .editar').prop('disabled', ocupado);
            });
        });
        function errorEdicion(xhr) {
            var mensaje = xhr && xhr.responseJSON && xhr.responseJSON.Mensaje;
            $('#error-edicion').text(mensaje || 'No se pudo confirmar el guardado. Conservamos el texto. Actualiza la lista para comprobar el resultado antes de reintentar.').prop('hidden', false);
        }
        $('#tareas-creadas').on('click', '.cambiar-estado', function () {
            if (guardando || ocupado) return;
            var boton = $(this), id = boton.attr('data-id');
            guardando = true;
            $('#error-estado, #exito-estado').prop('hidden', true);
            $('#actualizar, #guardar-tarea, .cambiar-estado').prop('disabled', true);
            $('#tareas-creadas').attr('aria-busy', 'true');
            $.ajax({
                url: panel.attr('data-estado-url'), method: 'POST', dataType: 'json', timeout: 15000,
                data: { id: id, completada: boton.attr('data-completada'), version: boton.attr('data-version'),
                    __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true) { errorEstado(); return; }
                $('#exito-estado').text('Estado actualizado para la tarea #' + id + '.').prop('hidden', false);
                consultar();
            }).fail(errorEstado).always(function () {
                guardando = false;
                $('#tareas-creadas').attr('aria-busy', 'false');
                $('#actualizar, #guardar-tarea, .cambiar-estado').prop('disabled', ocupado);
            });
        });
        function errorEstado(xhr) {
            var mensaje = xhr && xhr.responseJSON && xhr.responseJSON.Mensaje;
            $('#error-estado').text(mensaje || 'No se pudo confirmar el cambio. Actualiza la lista para comprobar el estado antes de reintentar.').prop('hidden', false);
        }
        formulario.on('submit', function (evento) {
            evento.preventDefault();
            if (guardando || ocupado) return;
            $('#error-crear, #exito-crear').prop('hidden', true);
            var titulo = $('#titulo-tarea').val().trim(), descripcion = $('#descripcion-tarea').val().trim();
            var tituloInvalido = titulo.length === 0 || titulo.length > 100;
            var descripcionInvalida = descripcion.length === 0 || descripcion.length > 1000;
            $('#titulo-tarea').attr('aria-invalid', String(tituloInvalido));
            $('#descripcion-tarea').attr('aria-invalid', String(descripcionInvalida));
            if (tituloInvalido || descripcionInvalida) {
                $('#error-crear').text('Escribe un título de 1 a 100 caracteres y una descripción de 1 a 1000. No uses solo espacios.').prop('hidden', false);
                $(tituloInvalido ? '#titulo-tarea' : '#descripcion-tarea').trigger('focus');
                return;
            }
            guardando = true;
            formulario.attr('aria-busy', 'true').find('input, textarea, button').prop('disabled', true);
            $('#actualizar, .cambiar-estado').prop('disabled', true);
            $.ajax({
                url: formulario.attr('action'), method: 'POST', dataType: 'json', timeout: 15000,
                data: { titulo: titulo, descripcion: descripcion, __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true) { errorCrear(); return; }
                formulario[0].reset();
                $('#exito-crear').text('Tarea creada correctamente como pendiente.').prop('hidden', false);
                consultar();
            }).fail(function (xhr) { errorCrear(xhr); }).always(function () {
                guardando = false;
                formulario.attr('aria-busy', 'false').find('input, textarea, button').prop('disabled', false);
                $('#guardar-tarea, #actualizar, .cambiar-estado').prop('disabled', ocupado);
            });
        });
        function errorCrear(xhr) {
            var mensaje = xhr && xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.Mensaje;
            $('#error-crear').text(mensaje || 'No se pudo confirmar el guardado. Conservamos tus datos. Actualiza la lista antes de reintentar para evitar duplicados; si la sesión cambió, recarga la página.').prop('hidden', false);
        }
        function consultar() {
            if (ocupado) return;
            ocupado = true;
            panel.attr('aria-busy', 'true');
            $('#actualizar, #guardar-tarea, .cambiar-estado').prop('disabled', true);
            $('#error-consulta, #lista-vacia').prop('hidden', true);
            $('#estado-consulta').text('Consultando la sesión…');
            $('#resumen-tareas').attr('aria-busy', 'true');
            $.ajax({
                url: panel.attr('data-consulta-url'),
                method: 'POST', dataType: 'json', timeout: 15000,
                data: { filtro: filtroActual, __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true || !Array.isArray(resultado.Tareas) ||
                    !Number.isInteger(resultado.Total) || !Number.isInteger(resultado.Pendientes) || !Number.isInteger(resultado.Completadas) ||
                    resultado.Pendientes < 0 || resultado.Completadas < 0 ||
                    resultado.Filtro !== filtroActual || resultado.Visibles !== resultado.Tareas.length ||
                    resultado.Visibles > resultado.Total || resultado.Total !== resultado.Pendientes + resultado.Completadas) {
                    fallo(); return;
                }
                $('#estado-consulta').text('Lista actualizada · ' + resultado.Visibles + ' de ' + resultado.Total + ' tareas · ' + filtroActual + '.');
                $('#lista-vacia').prop('hidden', resultado.Visibles !== 0);
                $('#titulo-vacio').text(resultado.Total === 0 ? 'Todavía no hay tareas' : 'No hay tareas ' + filtroActual);
                $('#detalle-vacio').text(resultado.Total === 0 ? 'Crea tu primer pendiente con el formulario.' : 'Selecciona otro filtro para consultar las demás tareas.');
                representar(resultado.Tareas);
                $('#total-tareas').text(resultado.Total);
                $('#total-pendientes').text(resultado.Pendientes);
                $('#total-completadas').text(resultado.Completadas);
                tieneConsulta = true;
                $('#resumen-tareas, #tareas-creadas').removeClass('is-stale');
            }).fail(fallo).always(function () {
                ocupado = false;
                panel.attr('aria-busy', 'false');
                $('#resumen-tareas').attr('aria-busy', 'false');
                $('#actualizar, #guardar-tarea, .cambiar-estado, .editar').prop('disabled', guardando);
            });
        }
        function fallo() {
            $('#estado-consulta').text(tieneConsulta ? 'No se pudo actualizar. El resumen y el listado conservan la última consulta; pueden estar desactualizados.' : 'Aún no se han podido cargar las tareas. Los guiones del resumen no representan ceros.');
            $('#resumen-tareas, #tareas-creadas').addClass('is-stale');
            $('#error-consulta').text('No fue posible consultar la lista. Compruebe que el servidor siga encendido e intente Actualizar lista. Si la sesión cambió, recargue la página.').prop('hidden', false);
        }
        $('#actualizar').on('click', consultar);
        consultar();
    });
}(jQuery));
