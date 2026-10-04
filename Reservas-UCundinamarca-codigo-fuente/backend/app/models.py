import enum
from datetime import datetime, date, time

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Date, Time,
    ForeignKey, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# Enums
# ============================================================
class RolUsuario(str, enum.Enum):
    cliente = "cliente"
    administrador = "administrador"


class TipoEspacio(str, enum.Enum):
    cancha_futbol = "cancha_futbol"
    cancha_baloncesto = "cancha_baloncesto"
    cancha_tenis = "cancha_tenis"
    piscina = "piscina"
    gimnasio = "gimnasio"


class EstadoEspacio(str, enum.Enum):
    disponible = "disponible"
    mantenimiento = "mantenimiento"
    inactivo = "inactivo"


class EstadoReserva(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    cancelada = "cancelada"
    completada = "completada"


class MetodoPago(str, enum.Enum):
    tarjeta = "tarjeta"
    transferencia = "transferencia"
    efectivo = "efectivo"


class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"


# ============================================================
# Entidad 1: Usuario
# ============================================================
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.cliente, nullable=False)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    reservas = relationship("Reserva", back_populates="usuario")
    resenas = relationship("Resena", back_populates="usuario")
    notificaciones = relationship("Notificacion", back_populates="usuario")


# ============================================================
# Entidad 2: EspacioDeportivo — Requerimiento 1
# ============================================================
class EspacioDeportivo(Base):
    __tablename__ = "espacios_deportivos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    tipo = Column(Enum(TipoEspacio), nullable=False)
    ubicacion = Column(String(150))
    capacidad = Column(Integer, default=1)
    precio_hora = Column(Float, nullable=False)
    estado = Column(Enum(EstadoEspacio), default=EstadoEspacio.disponible)

    reservas = relationship("Reserva", back_populates="espacio")
    resenas = relationship("Resena", back_populates="espacio")


# ============================================================
# Entidad 3: Reserva — Requerimientos 2 y 3
# ============================================================
class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    espacio_id = Column(Integer, ForeignKey("espacios_deportivos.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(Enum(EstadoReserva), default=EstadoReserva.pendiente, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    espacio = relationship("EspacioDeportivo", back_populates="reservas")
    usuario = relationship("Usuario", back_populates="reservas")
    pago = relationship("Pago", back_populates="reserva", uselist=False)
    resena = relationship("Resena", back_populates="reserva", uselist=False)

    # TODO (Requerimiento 7 — Historial y reprogramación, a cargo del estudiante):
    #   agregar aquí una entidad ReservaHistorial (o tabla de auditoría) que registre
    #   cada cambio de estado de la reserva, con fecha y estado anterior/nuevo,
    #   siguiendo el mismo patrón usado en el proyecto Helpdesk para TicketHistorial.


# ============================================================
# Entidad 4: Pago — Requerimiento 4
# ============================================================
class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), unique=True, nullable=False)
    monto = Column(Float, nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    estado = Column(Enum(EstadoPago), default=EstadoPago.pendiente)
    fecha_pago = Column(DateTime, default=datetime.utcnow)

    reserva = relationship("Reserva", back_populates="pago")


# ============================================================
# Entidad 5: Resena — propuesta al estudiante (Requerimiento 8)
# ============================================================
class Resena(Base):
    __tablename__ = "resenas"

    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), unique=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    espacio_id = Column(Integer, ForeignKey("espacios_deportivos.id"), nullable=False)
    calificacion = Column(Integer, nullable=False)  # 1 a 5
    comentario = Column(Text)
    fecha = Column(DateTime, default=datetime.utcnow)

    reserva = relationship("Reserva", back_populates="resena")
    usuario = relationship("Usuario", back_populates="resenas")
    espacio = relationship("EspacioDeportivo", back_populates="resenas")

    # TODO (Requerimiento 8 — Reseñas y calificaciones, a cargo del estudiante):
    #   crear el router `resenas.py` con:
    #     POST /api/resenas/            (solo si la reserva está 'completada')
    #     GET  /api/espacios/{id}/resenas
    #   y calcular el promedio de calificación por espacio.


# ============================================================
# Entidad 6: Notificacion — propuesta al estudiante (Requerimiento 6)
# ============================================================
class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), nullable=True)
    mensaje = Column(String(250), nullable=False)
    leida = Column(Boolean, default=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="notificaciones")

    # TODO (Requerimiento 6 — Notificaciones, a cargo del estudiante):
    #   generar un registro de Notificacion dentro de cambiar_estado_reserva()
    #   y dentro de registrar_pago() en pagos.py (ver los TODO ya dejados allí).
