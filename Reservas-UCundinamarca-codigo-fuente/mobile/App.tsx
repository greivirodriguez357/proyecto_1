import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import EspaciosScreen from "./src/screens/EspaciosScreen";
import ReservasScreen from "./src/screens/ReservasScreen";
import ReservaDetalleScreen from "./src/screens/ReservaDetalleScreen";
import PorCompletarListaScreen from "./src/screens/PorCompletarListaScreen";
import ReportesScreen from "./src/screens/ReportesScreen";
import NotificacionesScreen from "./src/screens/NotificacionesScreen";
import HistorialScreen from "./src/screens/HistorialScreen";
import ResenasScreen from "./src/screens/ResenasScreen";
import { COLORS } from "./src/theme/colors";
import { ReservasStackParamList, PorCompletarStackParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator();
const ReservasStack = createNativeStackNavigator<ReservasStackParamList>();
const PorCompletarStack = createNativeStackNavigator<PorCompletarStackParamList>();

function ReservasStackNavigator() {
  return (
    <ReservasStack.Navigator screenOptions={{ headerShown: false }}>
      <ReservasStack.Screen name="ReservasLista" component={ReservasScreen} />
      <ReservasStack.Screen name="ReservaDetalle" component={ReservaDetalleScreen} />
    </ReservasStack.Navigator>
  );
}

function PorCompletarStackNavigator() {
  return (
    <PorCompletarStack.Navigator screenOptions={{ headerShown: false }}>
      <PorCompletarStack.Screen name="PorCompletarLista" component={PorCompletarListaScreen} />
      <PorCompletarStack.Screen name="Reportes" component={ReportesScreen} />
      <PorCompletarStack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <PorCompletarStack.Screen name="Historial" component={HistorialScreen} />
      <PorCompletarStack.Screen name="Resenas" component={ResenasScreen} />
    </PorCompletarStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textGray,
          tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 58 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tab.Screen name="Espacios" component={EspaciosScreen} />
        <Tab.Screen name="Reservas" component={ReservasStackNavigator} />
        <Tab.Screen name="Por completar" component={PorCompletarStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
