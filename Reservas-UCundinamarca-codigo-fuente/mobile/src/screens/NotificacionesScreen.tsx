import React from "react";
import PantallaPorCompletar from "../components/PantallaPorCompletar";

export default function NotificacionesScreen() {
  return (
    <PantallaPorCompletar
      titulo="Notificaciones"
      requerimiento="Requerimiento 6 de 8"
      descripcion="Avisar al usuario cuando el estado de su reserva cambia: pago aprobado, reserva confirmada, próxima a iniciar, o cancelada."
      pistas={[
        "Backend: usar la entidad Notificacion ya modelada en models.py; generarla dentro de cambiar_estado_reserva() y registrar_pago() (ver los TODO ya dejados en reservas.py y pagos.py).",
        "Backend: endpoint GET /api/notificaciones/usuario/{id}, consultado periódicamente (polling) desde la app.",
        "Frontend: ícono de campana con contador de notificaciones no leídas, usando useEffect + setInterval o expo-notifications para notificaciones push locales.",
      ]}
    />
  );
}
