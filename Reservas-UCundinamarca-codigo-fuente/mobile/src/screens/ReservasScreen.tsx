import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, ScrollView, Alert, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import EncabezadoInstitucional from "../components/EncabezadoInstitucional";
import EtiquetaEstado from "../components/EtiquetaEstado";
import { COLORS } from "../theme/colors";
import { reservasApi, espaciosApi, usuariosApi, ReservaDetalle, Espacio, Usuario, EstadoReserva } from "../services/api";
import { ReservasStackParamList } from "../navigation/types";

const FILTROS: { value: EstadoReserva | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "completada", label: "Completadas" },
  { value: "cancelada", label: "Canceladas" },
];

type Props = NativeStackScreenProps<ReservasStackParamList, "ReservasLista">;

export default function ReservasScreen({ navigation }: Props) {
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<EstadoReserva | "todas">("todas");
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, e, u] = await Promise.all([
        reservasApi.listar(filtro === "todas" ? undefined : filtro),
        espaciosApi.listar(),
        usuariosApi.listar(),
      ]);
      setReservas(r);
      setEspacios(e.filter((x) => x.estado === "disponible"));
      setUsuarios(u);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar el listado de reservas.");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      cargar();
      // Igual que en EspaciosScreen: cerrar el modal al perder el foco para
      // que no quede flotando sobre otras pestañas del tab navigator.
      return () => setModalVisible(false);
    }, [cargar])
  );

  async function crearReserva() {
    if (!espacioId || !usuarioId || !fecha || !horaInicio || !horaFin) {
      Alert.alert("Faltan datos", "Completa espacio, solicitante, fecha y horario.");
      return;
    }
    try {
      await reservasApi.crear({
        espacio_id: espacioId,
        usuario_id: usuarioId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      });
      setModalVisible(false);
      setFecha(""); setHoraInicio(""); setHoraFin("");
      cargar();
    } catch (e: any) {
      const detalle = e?.response?.data?.detail ?? "No se pudo crear la reserva.";
      Alert.alert("No se pudo reservar", detalle);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <EncabezadoInstitucional titulo="Reservas" subtitulo="Requerimiento 2 · Creación de reservas" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filtroChip, filtro === f.value && styles.filtroChipActivo]}
            onPress={() => setFiltro(f.value)}
          >
            <Text style={[styles.filtroTexto, filtro === f.value && styles.filtroTextoActivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={reservas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay reservas para este filtro.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ReservaDetalle", { id: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.espacio.nombre}</Text>
              <Text style={styles.detalle}>{item.fecha} · {item.hora_inicio.slice(0, 5)} - {item.hora_fin.slice(0, 5)}</Text>
              <Text style={styles.detalle}>Solicitante: {item.usuario.nombre}</Text>
            </View>
            <EtiquetaEstado estado={item.estado} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <ScrollView>
              <Text style={styles.modalTitulo}>Nueva reserva</Text>

              <Text style={styles.label}>Espacio deportivo</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={espacioId} onValueChange={(v) => setEspacioId(v)}>
                  <Picker.Item label="Selecciona un espacio..." value={null} />
                  {espacios.map((e) => (
                    <Picker.Item key={e.id} label={`${e.nombre} — $${e.precio_hora.toLocaleString("es-CO")}/h`} value={e.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Solicitante</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={usuarioId} onValueChange={(v) => setUsuarioId(v)}>
                  <Picker.Item label="Selecciona un usuario..." value={null} />
                  {usuarios.map((u) => (
                    <Picker.Item key={u.id} label={u.nombre} value={u.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
              <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="2026-10-15" />

              <Text style={styles.label}>Hora inicio (HH:MM)</Text>
              <TextInput style={styles.input} value={horaInicio} onChangeText={setHoraInicio} placeholder="18:00" />

              <Text style={styles.label}>Hora fin (HH:MM)</Text>
              <TextInput style={styles.input} value={horaFin} onChangeText={setHoraFin} placeholder="19:00" />

              <View style={styles.botones}>
                <TouchableOpacity style={styles.botonSecundario} onPress={() => setModalVisible(false)}>
                  <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botonPrimario} onPress={crearReserva}>
                  <Text style={styles.botonPrimarioTexto}>Reservar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filtrosScroll: { flexGrow: 0, flexShrink: 0 },
  filtros: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: "#E7EEE9", marginRight: 8 },
  filtroChipActivo: { backgroundColor: COLORS.primary },
  filtroTexto: { fontSize: 12.5, color: COLORS.textGray, fontWeight: "600" },
  filtroTextoActivo: { color: "#FFFFFF" },
  vacio: { textAlign: "center", color: COLORS.textGray, marginTop: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 10,
  },
  nombre: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  detalle: { fontSize: 12.5, color: COLORS.textGray, marginTop: 2 },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  fabTexto: { color: "#FFFFFF", fontSize: 28, lineHeight: 30 },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContenido: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, maxHeight: "88%" },
  modalTitulo: { fontSize: 17, fontWeight: "700", color: COLORS.textDark, marginBottom: 14 },
  label: { fontSize: 12.5, color: COLORS.textGray, marginTop: 10, marginBottom: 4, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  pickerBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: "hidden" },
  botones: { flexDirection: "row", gap: 10, marginTop: 22, marginBottom: 8 },
  botonSecundario: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  botonSecundarioTexto: { color: COLORS.textGray, fontWeight: "600" },
  botonPrimario: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: COLORS.primary },
  botonPrimarioTexto: { color: "#FFFFFF", fontWeight: "700" },
});
