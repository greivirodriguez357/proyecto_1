import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import EncabezadoInstitucional from "../components/EncabezadoInstitucional";
import EtiquetaEstado from "../components/EtiquetaEstado";
import { COLORS } from "../theme/colors";
import { reservasApi, pagosApi, ReservaDetalle, MetodoPago } from "../services/api";
import { ReservasStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReservasStackParamList, "ReservaDetalle">;

function horas(inicio: string, fin: string) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
}

export default function ReservaDetalleScreen({ route }: Props) {
  const { id } = route.params;
  const [reserva, setReserva] = useState<ReservaDetalle | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta");
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    const data = await reservasApi.obtener(id);
    setReserva(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (!reserva) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <EncabezadoInstitucional titulo="Reserva" />
        <Text style={{ padding: 20, color: COLORS.textGray }}>Cargando...</Text>
      </View>
    );
  }

  const montoEsperado = Math.round(reserva.espacio.precio_hora * horas(reserva.hora_inicio, reserva.hora_fin));

  async function cambiarEstado(nuevo: "confirmada" | "cancelada" | "completada") {
    setProcesando(true);
    try {
      await reservasApi.cambiarEstado(reserva!.id, nuevo);
      await cargar();
    } catch (e: any) {
      Alert.alert("No se pudo cambiar el estado", e?.response?.data?.detail ?? "Error desconocido");
    } finally {
      setProcesando(false);
    }
  }

  async function pagar() {
    setProcesando(true);
    try {
      await pagosApi.registrar({ reserva_id: reserva!.id, metodo_pago: metodoPago, monto: montoEsperado });
      Alert.alert("Pago registrado", "El pago fue aprobado y la reserva quedó confirmada.");
      await cargar();
    } catch (e: any) {
      Alert.alert("No se pudo registrar el pago", e?.response?.data?.detail ?? "Error desconocido");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <EncabezadoInstitucional titulo={reserva.espacio.nombre} subtitulo={`Reserva #${reserva.id}`} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <View style={styles.filaEntre}>
            <Text style={styles.tituloSeccion}>Datos de la reserva</Text>
            <EtiquetaEstado estado={reserva.estado} />
          </View>
          <Text style={styles.linea}>Fecha: {reserva.fecha}</Text>
          <Text style={styles.linea}>Horario: {reserva.hora_inicio.slice(0, 5)} - {reserva.hora_fin.slice(0, 5)}</Text>
          <Text style={styles.linea}>Solicitante: {reserva.usuario.nombre}</Text>
          <Text style={styles.linea}>Valor: ${montoEsperado.toLocaleString("es-CO")}</Text>
        </View>

        {/* Requerimiento 3 — gestión de estados */}
        <View style={styles.card}>
          <Text style={styles.tituloSeccion}>Gestión de estado (Requerimiento 3)</Text>
          <View style={styles.botonesFila}>
            {reserva.estado === "pendiente" && (
              <TouchableOpacity disabled={procesando} style={styles.botonPeligro} onPress={() => cambiarEstado("cancelada")}>
                <Text style={styles.botonPeligroTexto}>Cancelar reserva</Text>
              </TouchableOpacity>
            )}
            {reserva.estado === "confirmada" && (
              <>
                <TouchableOpacity disabled={procesando} style={styles.botonPeligro} onPress={() => cambiarEstado("cancelada")}>
                  <Text style={styles.botonPeligroTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={procesando} style={styles.botonPrimario} onPress={() => cambiarEstado("completada")}>
                  <Text style={styles.botonPrimarioTexto}>Marcar completada</Text>
                </TouchableOpacity>
              </>
            )}
            {(reserva.estado === "cancelada" || reserva.estado === "completada") && (
              <Text style={styles.notaEstado}>Este es un estado final; la reserva ya no admite más cambios.</Text>
            )}
          </View>
        </View>

        {/* Requerimiento 4 — pago */}
        {reserva.estado === "pendiente" && !reserva.pago && (
          <View style={styles.card}>
            <Text style={styles.tituloSeccion}>Registrar pago (Requerimiento 4)</Text>
            <Text style={styles.linea}>Monto a pagar: ${montoEsperado.toLocaleString("es-CO")}</Text>
            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={metodoPago} onValueChange={(v) => setMetodoPago(v)}>
                <Picker.Item label="Tarjeta" value="tarjeta" />
                <Picker.Item label="Transferencia" value="transferencia" />
                <Picker.Item label="Efectivo" value="efectivo" />
              </Picker>
            </View>
            <TouchableOpacity disabled={procesando} style={[styles.botonPrimario, { marginTop: 12 }]} onPress={pagar}>
              <Text style={styles.botonPrimarioTexto}>Pagar y confirmar reserva</Text>
            </TouchableOpacity>
          </View>
        )}

        {reserva.pago && (
          <View style={styles.card}>
            <Text style={styles.tituloSeccion}>Pago registrado</Text>
            <Text style={styles.linea}>Monto: ${reserva.pago.monto.toLocaleString("es-CO")}</Text>
            <Text style={styles.linea}>Método: {reserva.pago.metodo_pago}</Text>
            <Text style={styles.linea}>Estado: {reserva.pago.estado}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    padding: 16, gap: 6,
  },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  tituloSeccion: { fontSize: 14.5, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  linea: { fontSize: 13.5, color: COLORS.textDark },
  botonesFila: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
  botonPrimario: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center" },
  botonPrimarioTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  botonPeligro: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.cancelada, alignItems: "center" },
  botonPeligroTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  notaEstado: { color: COLORS.textGray, fontSize: 12.5, fontStyle: "italic" },
  label: { fontSize: 12.5, color: COLORS.textGray, marginTop: 6, marginBottom: 4, fontWeight: "600" },
  pickerBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: "hidden" },
});
