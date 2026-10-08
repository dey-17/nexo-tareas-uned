using System.Web.Mvc;
using System.Web.UI;
using NexoTareas.Services;

namespace NexoTareas.Controllers
{
    [OutputCache(NoStore = true, Duration = 0, Location = OutputCacheLocation.None)]
    public class TareasController : Controller
    {
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
            return Json(new { Ok = true, Total = tareas.Count, Tareas = tareas });
        }
    }
}
