import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { firstValueFrom } from 'rxjs';

export interface SiembraRegistro {
  id: string;
  codigo_plan_siembra: string;
  fecha_propuesta: string;
  codigo_finca: string;
  codigo_cultivo: string;
  superficie_siembra: number | null;
  ph_suelo: number | null;
  textura_suelo: string;
  materia_organica: number | null;
  vel_infiltracion_min: number | null;
  vel_infiltracion_max: number | null;
  codigo_insumo: string;
  estado: 'activo' | 'inactivo';
  creado_en: string;
}

interface PlanesBase {
  planes: SiembraRegistro[];
}

const PLANES_STORAGE_KEY = 'planes_siembra';

@Injectable({
  providedIn: 'root'
})
export class SiembraStorageService {
  private storageReady?: Promise<Storage>;

  constructor(private storage: Storage, private http: HttpClient) {}

  async guardarSiembra(siembra: Omit<SiembraRegistro, 'id' | 'creado_en'>) {
    await this.inicializarPlanes();
    const registros = await this.obtenerSiembras();
    const nuevoRegistro: SiembraRegistro = {
      ...siembra,
      codigo_plan_siembra: siembra.codigo_plan_siembra || this.generarSiguienteCodigo(registros),
      estado: siembra.estado ?? 'activo',
      id: this.createId(),
      creado_en: new Date().toISOString()
    };

    await this.setSiembras([nuevoRegistro, ...registros]);
    return nuevoRegistro;
  }

  async obtenerSiembras(): Promise<SiembraRegistro[]> {
    await this.inicializarPlanes();
    const storage = await this.getStorage();
    return (await storage.get(PLANES_STORAGE_KEY)) ?? [];
  }

  async obtenerSiembraPorId(id: string) {
    const registros = await this.obtenerSiembras();
    return registros.find((registro) => registro.id === id);
  }

  async actualizarSiembra(id: string, siembra: Omit<SiembraRegistro, 'id' | 'creado_en'>) {
    const registros = await this.obtenerSiembras();
    const registroActual = registros.find((registro) => registro.id === id);

    if (!registroActual) {
      return undefined;
    }

    const registroActualizado: SiembraRegistro = {
      ...registroActual,
      ...siembra,
    };

    await this.setSiembras(
      registros.map((registro) => registro.id === id ? registroActualizado : registro)
    );

    return registroActualizado;
  }

  async generarCodigoPlanSiembra() {
    const registros = await this.obtenerSiembras();
    return this.generarSiguienteCodigo(registros);
  }

  private async setSiembras(registros: SiembraRegistro[]) {
    const storage = await this.getStorage();
    await storage.set(PLANES_STORAGE_KEY, registros);
  }

  private async inicializarPlanes() {
    const storage = await this.getStorage();
    const registros = await storage.get(PLANES_STORAGE_KEY);

    if (registros) {
      return;
    }

    const base = await firstValueFrom(this.http.get<PlanesBase>('assets/planes_base.json'));
    await storage.set(PLANES_STORAGE_KEY, base.planes ?? []);
  }

  private async getStorage() {
    this.storageReady ??= this.storage.create();
    return this.storageReady;
  }

  private generarSiguienteCodigo(registros: SiembraRegistro[]) {
    const ultimoNumero = registros.reduce((mayor, registro) => {
      const coincidencia = /^PLAN-(\d+)$/.exec(registro.codigo_plan_siembra);
      const numero = coincidencia ? Number(coincidencia[1]) : 0;
      return Math.max(mayor, numero);
    }, 0);

    return `PLAN-${String(ultimoNumero + 1).padStart(4, '0')}`;
  }

  private createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
