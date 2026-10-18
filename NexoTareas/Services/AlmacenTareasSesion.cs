using System;
using System.Collections.Generic;
using System.Web;
using NexoTareas.Models;

namespace NexoTareas.Services
{
    public class AlmacenTareasSesion
    {
        private const string Clave = "NexoTareas.Lista";
        private readonly HttpSessionStateBase sesion;

        public AlmacenTareasSesion(HttpSessionStateBase sesion)
        {
            if (sesion == null) throw new ArgumentNullException("sesion");
            this.sesion = sesion;
        }

        public List<Tarea> ObtenerLista()
        {
            var lista = sesion[Clave] as List<Tarea>;
            if (lista == null)
            {
                lista = new List<Tarea>();
                sesion[Clave] = lista;
            }
            return lista;
        }

        public int SiguienteId()
        {
            const string claveId = "NexoTareas.UltimoId";
            var ultimo = sesion[claveId] as int? ?? 0;
            foreach (var tarea in ObtenerLista()) ultimo = Math.Max(ultimo, tarea.Id);
            var siguiente = checked(ultimo + 1);
            sesion[claveId] = siguiente;
            return siguiente;
        }
    }
}
