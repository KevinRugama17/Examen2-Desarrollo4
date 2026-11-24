<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Equipos</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/tabs/equipos/nuevo" aria-label="Nuevo equipo">
            <ion-icon slot="icon-only" :icon="add" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="q" :debounce="400" placeholder="Buscar por código o nombre" @ion-input="buscar" />
      </ion-toolbar>
      <!-- YA IMPLEMENTADO: depende de useConexion() [M7] -->
      <ion-toolbar v-if="!conectado" color="warning">
        <ion-title size="small">Sin conexión: los datos pueden estar desactualizados</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refrescar">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="cargando && equipos.length === 0">
        <ion-item v-for="n in 6" :key="n">
          <ion-label>
            <h2><ion-skeleton-text :animated="true" style="width: 65%" /></h2>
            <p><ion-skeleton-text :animated="true" style="width: 45%" /></p>
          </ion-label>
          <ion-skeleton-text slot="end" :animated="true" style="width: 72px; height: 20px; border-radius: 8px" />
        </ion-item>
      </ion-list>

      <div v-else-if="error" class="estado-vacio">
        <ion-icon :icon="cloudOfflineOutline" aria-hidden="true" />
        <p>{{ error }}</p>
        <ion-button fill="outline" @click="cargar(true)">Reintentar</ion-button>
      </div>

      <div v-else-if="equipos.length === 0" class="estado-vacio">
        <ion-icon :icon="searchOutline" aria-hidden="true" />
        <p>No se encontraron equipos.</p>
      </div>

      <template v-else>
        <!-- TODO [M6] Eliminación (8 pts): envolver cada ion-item en ion-item-sliding -->
        <ion-list>
          <ion-item
            v-for="equipo in equipos"
            :key="equipo.id"
            :router-link="`/tabs/equipos/${equipo.id}/editar`"
            detail
          >
            <ion-label>
              <h2>{{ equipo.nombre }}</h2>
              <p>{{ equipo.codigo }} · {{ equipo.categoria.nombre }}</p>
            </ion-label>
            <ion-badge slot="end" :color="colorEstado[equipo.estado]">
              {{ equipo.estado }}
            </ion-badge>
          </ion-item>
        </ion-list>

        <ion-infinite-scroll :disabled="!hayMas" @ion-infinite="cargarMas">
          <ion-infinite-scroll-content loading-text="Cargando más equipos…" />
        </ion-infinite-scroll>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSearchbar, IonContent,
  IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonSkeletonText, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption, IonInfiniteScroll, IonInfiniteScrollContent,
  alertController, onIonViewWillEnter,
} from '@ionic/vue';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/vue';
import { add, cloudOfflineOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { eliminar, listar, type Equipo, type Estado } from '@/services/equipos';
import { ErrorApi } from '@/services/errores';
import { mostrarToast } from '@/services/avisos';
import { useConexion, vibrar } from '@/composables/useConexion';

// Reservados para M6 (eliminación deslizante)
void [IonItemSliding, IonItemOptions, IonItemOption, trashOutline];

const colorEstado: Record<Estado, string> = { disponible: 'success', prestado: 'warning', mantenimiento: 'medium' };

const { conectado } = useConexion();

const equipos = ref<Equipo[]>([]);
const pagina = ref(0);
const ultimaPagina = ref(1);
const q = ref('');
const cargando = ref(false);
const error = ref('');
const hayMas = computed(() => pagina.value < ultimaPagina.value);
let idPeticionActual = 0;

/**
 * [M4] cargar(reiniciar)
 *  - reiniciar = true  → pide la página 1 y REEMPLAZA la lista.
 *  - reiniciar = false → pide la página siguiente y la AGREGA al final.
 */
async function cargar(reiniciar = false) {
  if (!reiniciar && (cargando.value || !hayMas.value)) return;

  const idPeticion = ++idPeticionActual;
  const paginaSolicitada = reiniciar ? 1 : pagina.value + 1;
  cargando.value = true;
  error.value = '';

  try {
    const respuesta = await listar(paginaSolicitada, q.value.trim());
    if (idPeticion !== idPeticionActual) return;

    equipos.value = reiniciar ? respuesta.data : [...equipos.value, ...respuesta.data];
    pagina.value = respuesta.meta.current_page;
    ultimaPagina.value = respuesta.meta.last_page;
  } catch (err) {
    if (idPeticion !== idPeticionActual) return;
    if (reiniciar) equipos.value = [];
    error.value = err instanceof ErrorApi ? err.message : 'No fue posible cargar los equipos.';
  } finally {
    if (idPeticion === idPeticionActual) {
      cargando.value = false;
    }
  }
}

onIonViewWillEnter(() => {
  cargar(true);
});

const buscar = () => cargar(true);

async function refrescar(evento: RefresherCustomEvent) {
  await cargar(true);
  await evento.target.complete();
}

async function cargarMas(evento: InfiniteScrollCustomEvent) {
  await cargar(false);
  await evento.target.complete();
}

/**
 * TODO [M6] confirmarEliminacion(equipo, evento)
 */
async function confirmarEliminacion(equipo: Equipo, evento: Event) {
  void [equipo, evento, alertController, ErrorApi, mostrarToast, vibrar, eliminar];
}

void confirmarEliminacion;
</script>
