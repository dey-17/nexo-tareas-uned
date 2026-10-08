(function ($) {
    'use strict';
    $(function () {
        var panel = $('#panel-tareas'), ocupado = false;
        function consultar() {
            if (ocupado) return;
            ocupado = true;
            panel.attr('aria-busy', 'true');
            $('#actualizar').prop('disabled', true);
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
                $('#estado-consulta').text('Lista actualizada · ' + resultado.Total + ' tareas en esta sesión.');
                $('#lista-vacia').prop('hidden', resultado.Total !== 0);
            }).fail(fallo).always(function () {
                ocupado = false;
                panel.attr('aria-busy', 'false');
                $('#actualizar').prop('disabled', false);
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
