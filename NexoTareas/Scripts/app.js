(function ($) {
    'use strict';
    $(function () {
        var panel = $('#panel-tareas'), ocupado = false;
        var guardando = false, formulario = $('#crear-tarea');
        function representar(tareas) {
            var lista = $('#tareas-creadas').empty();
            tareas.forEach(function (tarea) {
                var item = $('<li>');
                $('<h3>').text(tarea.Titulo).appendTo(item);
                $('<p>').text(tarea.Descripcion).appendTo(item);
                $('<small>').text(tarea.Completada ? 'Completada' : 'Pendiente').appendTo(item);
                item.appendTo(lista);
            });
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
            $('#actualizar').prop('disabled', true);
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
                $('#guardar-tarea, #actualizar').prop('disabled', ocupado);
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
            $('#actualizar, #guardar-tarea').prop('disabled', true);
            $('#error-consulta, #lista-vacia').prop('hidden', true);
            $('#estado-consulta').text('Consultando la sesión…');
            $.ajax({
                url: panel.attr('data-consulta-url'),
                method: 'POST', dataType: 'json', timeout: 15000,
                data: { __RequestVerificationToken: panel.find('input[name="__RequestVerificationToken"]').val() }
            }).done(function (resultado) {
                if (!resultado || resultado.Ok !== true || !Array.isArray(resultado.Tareas)) {
                    fallo(); return;
                }
                $('#estado-consulta').text('Lista actualizada · ' + resultado.Total + (resultado.Total === 1 ? ' tarea' : ' tareas') + ' en esta sesión.');
                $('#lista-vacia').prop('hidden', resultado.Total !== 0);
                representar(resultado.Tareas);
            }).fail(fallo).always(function () {
                ocupado = false;
                panel.attr('aria-busy', 'false');
                $('#actualizar, #guardar-tarea').prop('disabled', guardando);
            });
        }
        function fallo() {
            $('#estado-consulta').text('La consulta no se completó.');
            $('#error-consulta').text('No fue posible consultar la lista. Compruebe que el servidor siga encendido e intente Actualizar lista. Si la sesión cambió, recargue la página.').prop('hidden', false);
        }
        $('#actualizar').on('click', consultar);
        consultar();
    });
}(jQuery));
