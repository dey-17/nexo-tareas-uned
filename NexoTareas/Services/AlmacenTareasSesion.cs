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
    }
}
