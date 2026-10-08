using System.Web.Mvc;
using System.Web.Routing;

namespace NexoTareas
{
    public static class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            routes.MapRoute("Default", "{controller}/{action}/{id}",
                new { controller = "Tareas", action = "Index", id = UrlParameter.Optional });
        }
    }
}
