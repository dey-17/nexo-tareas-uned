using System;
using System.Linq;
using System.Web.Mvc;
using NexoTareas.Models;
using System.Web.UI;
using NexoTareas.Services;

namespace NexoTareas.Controllers
{
    [OutputCache(NoStore = true, Duration = 0, Location = OutputCacheLocation.None)]
    public class TareasController : Controller
    {
        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult Crear(string titulo, string descripcion)
        {
            titulo = (titulo ?? "").Trim();
            descripcion = (descripcion ?? "").Trim();
            if (titulo.Length == 0 || titulo.Length > 100 || descripcion.Length == 0 || descripcion.Length > 1000)
            {
                Response.StatusCode = 400;
                Response.TrySkipIisCustomErrors = true;
                return Json(new { Ok = false, Mensaje = "El título debe tener entre 1 y 100 caracteres y la descripción entre 1 y 1000. No se aceptan solo espacios." });
            }
            var tareas = new AlmacenTareasSesion(Session).ObtenerLista();
            var tarea = new Tarea {
                Id = tareas.Count == 0 ? 1 : checked(tareas.Max(t => t.Id) + 1),
                Titulo = titulo, Descripcion = descripcion,
                Completada = false, CreadaUtc = DateTime.UtcNow, Version = 1
            };
            tareas.Add(tarea);
            return Json(new { Ok = true, Tarea = tarea });
        }

        [HttpGet]
        public ActionResult Index()
        {
            new AlmacenTareasSesion(Session).ObtenerLista();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult Consultar()
        {
            var tareas = new AlmacenTareasSesion(Session).ObtenerLista();
            var completadas = tareas.Count(t => t.Completada);
            return Json(new {
                Ok = true, Total = tareas.Count,
                Pendientes = tareas.Count - completadas, Completadas = completadas,
                Tareas = tareas.OrderByDescending(t => t.Id).ToList()
            });
        }
    }
}
