import React from "react";
import PantallaPorCompletar from "../components/PantallaPorCompletar";

export default function HistorialScreen() {
  return (
    <PantallaPorCompletar
      titulo="Historial y Reprogramación"
      requerimiento="Requerimiento 7 de 8"
      descripcion="Registrar cada cambio de estado de una reserva (estado anterior, estado nuevo, fecha) y permitir reprogramar una reserva pendiente a un nuevo horario disponible."
      pistas={[
        "Backend: nueva entidad ReservaHistorial insertada dentro de cambiar_estado_reserva() (ver el TODO ya dejado en models.py y reservas.py).",
        "Backend: endpoint GET /api/reservas/{id}/historial y PATCH /api/reservas/{id}/reprogramar, reutilizando la misma validación de solapamiento del Requerimiento 2.",
        "Frontend: línea de tiempo vertical (FlatList con un ítem por evento) dentro de la propia pantalla de detalle de la reserva.",
      ]}
    />
  );
}
