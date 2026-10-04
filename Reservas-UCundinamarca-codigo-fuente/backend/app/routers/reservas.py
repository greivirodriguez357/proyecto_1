from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/reservas", tags=["reservas"])

# ------------------------------------------------------------
# Requerimiento 3 — máquina de estados de la Reserva
# ------------------------------------------------------------
TRANSICIONES_VALIDAS = {
    models.EstadoReserva.pendiente: {models.EstadoReserva.confirmada, models.EstadoReserva.cancelada},
    models.EstadoReserva.confirmada: {models.EstadoReserva.completada, models.EstadoReserva.cancelada},
    models.EstadoReserva.cancelada: set(),   # estado final
    models.EstadoReserva.completada: set(),  # estado final
}


def _cargar_relaciones(query):
    return query.options(
        joinedload(models.Reserva.espacio),
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.pago),
    )


@router.get("/", response_model=list[schemas.ReservaDetalleOut])
def listar_reservas(estado: models.EstadoReserva | None = None, db: Session = Depends(get_db)):
    query = _cargar_relaciones(db.query(models.Reserva))
    if estado:
        query = query.filter(models.Reserva.estado == estado)
    return query.order_by(models.Reserva.fecha.desc(), models.Reserva.hora_inicio).all()


@router.get("/{reserva_id}", response_model=schemas.ReservaDetalleOut)
def obtener_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = _cargar_relaciones(db.query(models.Reserva)).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(404, "Reserva no encontrada")
    return reserva


# ------------------------------------------------------------
# Requerimiento 2 — creación de reservas, con validación de
# solapamiento de horario sobre el mismo espacio.
# ------------------------------------------------------------
@router.post("/", response_model=schemas.ReservaDetalleOut, status_code=201)
def crear_reserva(datos: schemas.ReservaCreate, db: Session = Depends(get_db)):
    espacio = db.get(models.EspacioDeportivo, datos.espacio_id)
    if not espacio:
        raise HTTPException(404, "Espacio no encontrado")
    if espacio.estado != models.EstadoEspacio.disponible:
        raise HTTPException(400, f"El espacio no está disponible (estado actual: {espacio.estado.value})")

    if datos.hora_fin <= datos.hora_inicio:
        raise HTTPException(400, "La hora de fin debe ser posterior a la hora de inicio")

    usuario = db.get(models.Usuario, datos.usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    # Regla de negocio: no puede haber dos reservas activas (pendiente o
    # confirmada) que se solapen en horario para el mismo espacio y fecha.
    reservas_del_dia = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.espacio_id == datos.espacio_id,
            models.Reserva.fecha == datos.fecha,
            models.Reserva.estado.in_([models.EstadoReserva.pendiente, models.EstadoReserva.confirmada]),
        )
        .all()
    )
    for r in reservas_del_dia:
        if datos.hora_inicio < r.hora_fin and datos.hora_fin > r.hora_inicio:
            raise HTTPException(
                400,
                f"El espacio ya está reservado de {r.hora_inicio} a {r.hora_fin} en esa fecha",
            )

    reserva = models.Reserva(**datos.model_dump(), estado=models.EstadoReserva.pendiente)
    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    # TODO (Requerimiento 6 — Notificaciones, a cargo del estudiante):
    #   crear aquí una Notificacion para el usuario confirmando que su
    #   solicitud de reserva fue registrada y queda pendiente de pago.

    return _cargar_relaciones(db.query(models.Reserva)).filter(models.Reserva.id == reserva.id).first()


# ------------------------------------------------------------
# Requerimiento 3 — cambio de estado validado contra la máquina de estados
# ------------------------------------------------------------
@router.patch("/{reserva_id}/estado", response_model=schemas.ReservaDetalleOut)
def cambiar_estado_reserva(reserva_id: int, datos: schemas.ReservaCambiarEstado, db: Session = Depends(get_db)):
    reserva = db.get(models.Reserva, reserva_id)
    if not reserva:
        raise HTTPException(404, "Reserva no encontrada")

    if datos.estado not in TRANSICIONES_VALIDAS[reserva.estado]:
        raise HTTPException(
            400,
            f"Transición no válida: {reserva.estado.value} -> {datos.estado.value}",
        )

    # No se puede marcar como 'completada' una reserva sin pago aprobado.
    if datos.estado == models.EstadoReserva.completada:
        if not reserva.pago or reserva.pago.estado != models.EstadoPago.aprobado:
            raise HTTPException(400, "No se puede completar una reserva sin un pago aprobado")

    reserva.estado = datos.estado
    db.commit()
    db.refresh(reserva)

    # TODO (Requerimiento 7 — Historial, a cargo del estudiante):
    #   registrar aquí el cambio de estado en ReservaHistorial (estado anterior,
    #   estado nuevo, fecha), siguiendo el TODO dejado en models.py.
    # TODO (Requerimiento 6 — Notificaciones, a cargo del estudiante):
    #   generar una Notificacion informando al usuario del cambio de estado.

    return _cargar_relaciones(db.query(models.Reserva)).filter(models.Reserva.id == reserva.id).first()
