import React from "react";
import PantallaPorCompletar from "../components/PantallaPorCompletar";

export default function ReportesScreen() {
  return (
    <PantallaPorCompletar
      titulo="Reportes y Estadísticas"
      requerimiento="Requerimiento 5 de 8"
      descripcion="Construir un panel con estadísticas agregadas del sistema: espacio con más reservas, ingresos totales por período y porcentaje de ocupación por tipo de espacio."
      pistas={[
        "Backend: nuevo endpoint GET /api/reportes/resumen usando func.count(), func.sum() y group_by() de SQLAlchemy sobre las tablas reservas y pagos.",
        "Frontend: pantalla con tarjetas de estadísticas (componentes View + Text reutilizables), opcionalmente con una librería de gráficos como react-native-chart-kit o Victory Native.",
        "Extensión sugerida: filtros por rango de fechas y por tipo de espacio deportivo.",
      ]}
    />
  );
}
