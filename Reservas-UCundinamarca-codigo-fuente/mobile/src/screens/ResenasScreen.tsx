import React from "react";
import PantallaPorCompletar from "../components/PantallaPorCompletar";

export default function ResenasScreen() {
  return (
    <PantallaPorCompletar
      titulo="Reseñas y Calificaciones"
      requerimiento="Requerimiento 8 de 8"
      descripcion="Permitir que el usuario califique (1 a 5) y comente un espacio deportivo después de que su reserva quede en estado 'completada', y mostrar el promedio de calificación de cada espacio."
      pistas={[
        "Backend: la entidad Resena ya está modelada en models.py; crear el router resenas.py con POST /api/resenas/ (validando que la reserva esté 'completada' y no tenga ya una reseña) y GET /api/espacios/{id}/resenas.",
        "Backend: calcular el promedio de calificación con func.avg() y exponerlo en el detalle del espacio.",
        "Frontend: formulario de calificación con estrellas (TouchableOpacity en fila) en la pantalla de detalle de la reserva, visible solo cuando el estado es 'completada'.",
      ]}
    />
  );
}
