import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface CatalogoFincaRegistro {
  id: string;
  codigo_finca: string;
  nombre_finca: string;
  codigo_cultivo: string;
  nombre_cultivo: string;
  etapa: string;
  observacion: string;
  foto_data_url: string;
  creado_en: string;
}

const CATALOGO_FINCAS_STORAGE_KEY = 'catalogo_fincas';

@Injectable({
  providedIn: 'root'
})
export class CatalogoFincasStorageService {
  private storageReady?: Promise<Storage>;

  constructor(private storage: Storage) {}

  async guardarRegistro(registro: Omit<CatalogoFincaRegistro, 'id' | 'creado_en'>) {
    const registros = await this.obtenerRegistros();
    const nuevoRegistro: CatalogoFincaRegistro = {
      ...registro,
      id: this.createId(),
      creado_en: new Date().toISOString()
    };

    await this.setRegistros([nuevoRegistro, ...registros]);
    return nuevoRegistro;
  }

  async obtenerRegistros(): Promise<CatalogoFincaRegistro[]> {
    const storage = await this.getStorage();
    return (await storage.get(CATALOGO_FINCAS_STORAGE_KEY)) ?? [];
  }

  async eliminarRegistro(id: string) {
    const registros = await this.obtenerRegistros();
    await this.setRegistros(registros.filter((registro) => registro.id !== id));
  }

  private async setRegistros(registros: CatalogoFincaRegistro[]) {
    const storage = await this.getStorage();
    await storage.set(CATALOGO_FINCAS_STORAGE_KEY, registros);
  }

  private async getStorage() {
    this.storageReady ??= this.storage.create();
    return this.storageReady;
  }

  private createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
