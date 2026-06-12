import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface TareaFinca {
  id: string;
  codigo_finca: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'pendiente' | 'completada';
  creado_en: string;
}

const TAREAS_STORAGE_KEY = 'tareas_finca';

@Injectable({
  providedIn: 'root'
})
export class TareaStorageService {
  private storageReady?: Promise<Storage>;

  constructor(private storage: Storage) {}

  async guardarTarea(tarea: Omit<TareaFinca, 'id' | 'creado_en'>) {
    const tareas = await this.obtenerTareas();
    const nuevaTarea: TareaFinca = {
      ...tarea,
      id: this.createId(),
      creado_en: new Date().toISOString()
    };

    await this.setTareas([nuevaTarea, ...tareas]);
    return nuevaTarea;
  }

  async obtenerTareas(): Promise<TareaFinca[]> {
    const storage = await this.getStorage();
    return (await storage.get(TAREAS_STORAGE_KEY)) ?? [];
  }

  async cambiarEstadoTarea(id: string, estado: TareaFinca['estado']) {
    const tareas = await this.obtenerTareas();
    const tareasActualizadas = tareas.map((tarea) =>
      tarea.id === id ? { ...tarea, estado } : tarea
    );

    await this.setTareas(tareasActualizadas);
  }

  async eliminarTarea(id: string) {
    const tareas = await this.obtenerTareas();
    await this.setTareas(tareas.filter((tarea) => tarea.id !== id));
  }

  private async setTareas(tareas: TareaFinca[]) {
    const storage = await this.getStorage();
    await storage.set(TAREAS_STORAGE_KEY, tareas);
  }

  private async getStorage() {
    this.storageReady ??= this.storage.create();
    return this.storageReady;
  }

  private createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
