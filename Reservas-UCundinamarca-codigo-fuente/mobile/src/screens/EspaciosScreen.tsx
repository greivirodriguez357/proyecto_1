import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

interface Espacio {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  capacidad: number;
  precio_hora: number;
  estado: 'disponible' | 'mantenimiento' | 'inactivo';
}

export default function EspaciosScreen() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalBajaVisible, setModalBajaVisible] = useState(false);

  // Formulario Creación
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [precioHora, setPrecioHora] = useState('');

  // Edición y Baja
  const [espacioEditando, setEspacioEditando] = useState<Espacio | null>(null);
  const [espacioParaBaja, setEspacioParaBaja] = useState<Espacio | null>(null);

  const fetchEspacios = async () => {
    try {
      const response = await api.get<Espacio[]>('/api/espacios/');
      setEspacios(response.data);
    } catch (error) {
      console.error('Error al cargar espacios:', error);
      Alert.alert('Error', 'No se pudieron cargar los espacios del servidor.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEspacios();
    }, [])
  );

  const handleCrear = async () => {
    if (!nombre || !tipo || !precioHora) {
      Alert.alert('Campos requeridos', 'Por favor llena nombre, tipo y precio por hora.');
      return;
    }

    try {
      await api.post('/api/espacios/', {
        nombre,
        tipo,
        ubicacion,
        capacidad: parseInt(capacidad) || 1,
        precio_hora: parseFloat(precioHora),
        estado: 'disponible'
      });
      setModalVisible(false);
      limpiarFormulario();
      fetchEspacios();
      Alert.alert('Éxito', 'Espacio guardado en la base de datos.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el espacio.');
    }
  };

  const handleGuardarEdicion = async () => {
    if (!espacioEditando) return;
    try {
      await api.put(`/api/espacios/${espacioEditando.id}`, {
        nombre: espacioEditando.nombre,
        tipo: espacioEditando.tipo,
        ubicacion: espacioEditando.ubicacion,
        capacidad: Number(espacioEditando.capacidad),
        precio_hora: Number(espacioEditando.precio_hora),
      });
      setModalEditarVisible(false);
      setEspacioEditando(null);
      fetchEspacios();
      Alert.alert('Éxito', 'Espacio actualizado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el espacio.');
    }
  };

  const confirmarDarDeBaja = async () => {
    if (!espacioParaBaja) return;
    try {
      await api.delete(`/api/espacios/${espacioParaBaja.id}`);
      setModalBajaVisible(false);
      setEspacioParaBaja(null);
      fetchEspacios();
      Alert.alert('Éxito', 'El espacio ha quedado inactivo.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo dar de baja el espacio.');
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setTipo('');
    setUbicacion('');
    setCapacidad('');
    setPrecioHora('');
  };

  const renderItem = ({ item }: { item: Espacio }) => {
    const isInactivo = item.estado === 'inactivo';

    return (
      <View style={[styles.card, isInactivo && styles.cardInactivo]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isInactivo && styles.textInactivo]}>
            {item.nombre}
          </Text>
          <View style={[
            styles.badge, 
            item.estado === 'disponible' ? styles.badgeDisponible : 
            item.estado === 'mantenimiento' ? styles.badgeMantenimiento : styles.badgeInactivo
          ]}>
            <Text style={styles.badgeText}>{item.estado}</Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>{item.tipo} · {item.ubicacion || 'Sin ubicación'}</Text>
        <Text style={styles.cardDetails}>$ {item.precio_hora?.toLocaleString()} / hora · Cap. {item.capacidad}</Text>

        {/* Botones de Editar y Dar de baja abajo a la derecha con colores vivos */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.btnAction, styles.btnEditar, isInactivo && styles.btnDisabled]}
            disabled={isInactivo}
            onPress={() => {
              setEspacioEditando(item);
              setModalEditarVisible(true);
            }}
          >
            <Text style={styles.btnActionText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnBaja, isInactivo && styles.btnDisabled]}
            disabled={isInactivo}
            onPress={() => {
              setEspacioParaBaja(item);
              setModalBajaVisible(true);
            }}
          >
            <Text style={styles.btnActionText}>Dar de baja</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Encabezado institucional superior */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Espacios Deportivos</Text>
        <Text style={styles.headerSubtitle}>Requerimiento 1 · CRUD de espacios</Text>
      </View>

      <FlatList
        data={espacios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Botón flotante para agregar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          limpiarFormulario();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* MODAL CREAR */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Nuevo Espacio</Text>
            
            <TextInput style={styles.input} placeholder="Nombre *" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Tipo (ej. cancha_futbol) *" value={tipo} onChangeText={setTipo} />
            <TextInput style={styles.input} placeholder="Ubicación" value={ubicacion} onChangeText={setUbicacion} />
            <TextInput style={styles.input} placeholder="Capacidad" keyboardType="numeric" value={capacidad} onChangeText={setCapacidad} />
            <TextInput style={styles.input} placeholder="Precio por hora *" keyboardType="numeric" value={precioHora} onChangeText={setPrecioHora} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btnModal, styles.btnCancelar]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnModal, styles.btnGuardar]} onPress={handleCrear}>
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal visible={modalEditarVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Espacio</Text>
            
            {espacioEditando && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={espacioEditando.nombre}
                  onChangeText={(val) => setEspacioEditando({ ...espacioEditando, nombre: val })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tipo"
                  value={espacioEditando.tipo}
                  onChangeText={(val) => setEspacioEditando({ ...espacioEditando, tipo: val })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ubicación"
                  value={espacioEditando.ubicacion}
                  onChangeText={(val) => setEspacioEditando({ ...espacioEditando, ubicacion: val })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Capacidad"
                  keyboardType="numeric"
                  value={espacioEditando.capacidad?.toString()}
                  onChangeText={(val) => setEspacioEditando({ ...espacioEditando, capacidad: parseInt(val) || 0 })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Precio por hora"
                  keyboardType="numeric"
                  value={espacioEditando.precio_hora?.toString()}
                  onChangeText={(val) => setEspacioEditando({ ...espacioEditando, precio_hora: parseFloat(val) || 0 })}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btnModal, styles.btnCancelar]} onPress={() => setModalEditarVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnModal, styles.btnGuardar]} onPress={handleGuardarEdicion}>
                <Text style={styles.btnText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL CONFIRMACIÓN DAR DE BAJA */}
      <Modal visible={modalBajaVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirmar Baja</Text>
            <Text style={styles.confirmText}>
              ¿Estás seguro de dar de baja el espacio <Text style={{fontWeight: 'bold'}}>{espacioParaBaja?.nombre}</Text>? Pasará a estado inactivo.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btnModal, styles.btnCancelar]} onPress={() => setModalBajaVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnModal, styles.btnBajaConfirm]} onPress={confirmarDarDeBaja}>
                <Text style={styles.btnText}>Sí, Dar de baja</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  headerContainer: { backgroundColor: '#194d33', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#dcdcdc', fontSize: 12 },
  listContainer: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  cardInactivo: { backgroundColor: '#e9ecef', opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  textInactivo: { textDecorationLine: 'line-through', color: '#6c757d' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeDisponible: { backgroundColor: '#d4edda' },
  badgeMantenimiento: { backgroundColor: '#fff3cd' },
  badgeInactivo: { backgroundColor: '#f8d7da' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#333', textTransform: 'uppercase' },
  cardSubtitle: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardDetails: { fontSize: 13, color: '#444', fontWeight: '500', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  btnAction: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnEditar: { backgroundColor: '#007bff' },
  btnBaja: { backgroundColor: '#dc3545' },
  btnDisabled: { backgroundColor: '#adb5bd' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#194d33', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, maxHeight: '80%' },
  confirmBox: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#194d33' },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#dc3545' },
  confirmText: { fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, backgroundColor: '#fafafa' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btnModal: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  btnCancelar: { backgroundColor: '#6c757d' },
  btnGuardar: { backgroundColor: '#194d33' },
  btnBajaConfirm: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});