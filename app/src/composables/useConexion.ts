import { onMounted, onUnmounted, ref } from 'vue';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useConexion() {
  const conectado = ref(true);
  const tipo = ref('unknown');
  let oyente: Promise<PluginListenerHandle> | null = null;

  const actualizarEstado = (estado: ConnectionStatus) => {
    conectado.value = estado.connected;
    tipo.value = estado.connectionType;
  };

  onMounted(async () => {
    oyente = Network.addListener('networkStatusChange', actualizarEstado);
    const estadoInicial = await Network.getStatus();
    actualizarEstado(estadoInicial);
  });

  onUnmounted(() => {
    void oyente?.then((handle) => handle.remove());
  });

  return { conectado, tipo };
}

export async function vibrar() {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}
