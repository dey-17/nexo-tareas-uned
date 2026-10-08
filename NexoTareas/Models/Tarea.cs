using System;

namespace NexoTareas.Models
{
    public class Tarea
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public bool Completada { get; set; }
        public DateTime CreadaUtc { get; set; }
        public int Version { get; set; }
    }
}
