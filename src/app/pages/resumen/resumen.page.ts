import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { SiembraRegistro, SiembraStorageService } from 'src/app/services/siembra-storage.service';
import { TareaStorageService } from 'src/app/services/tarea-storage.service';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  checkmarkCircleOutline,
  gridOutline,
  homeOutline,
  leafOutline,
  locationOutline,
  personOutline,
  saveOutline,
  settingsOutline,
  wifiOutline
} from 'ionicons/icons';

interface SummaryMetric {
  labelKey: string;
  value: string;
  detailKey: string;
  icon: string;
}

interface SummaryService {
  key: string;
  title: string;
  status: string;
  enabled: boolean;
  icon: string;
}

interface CropStat {
  name: string;
  plans: number;
  area: number;
  percentage: number;
}

type StoredServiceState = Record<string, {
  enabled?: boolean;
  status?: string;
}>;

const DEVICE_CONTROLS_STATE_KEY = 'appfincas.deviceControlsState';

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.page.html',
  styleUrls: ['./resumen.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, CommonModule, RouterLink, TranslatePipe]
})
export class ResumenPage implements OnInit {
  metrics: SummaryMetric[] = [];
  services: SummaryService[] = [];
  cropStats: CropStat[] = [];
  totalArea = 0;
  activePlans = 0;
  inactivePlans = 0;
  pendingTasks = 0;

  cultivos = [
    { codigo: 'CULT-001', nombre: 'Platano' },
    { codigo: 'CULT-002', nombre: 'Cacao' },
    { codigo: 'CULT-003', nombre: 'Maiz' },
  ];

  constructor(
    private siembraStorage: SiembraStorageService,
    private tareaStorage: TareaStorageService
  ) {
    addIcons({
      barChartOutline,
      cameraOutline,
      checkmarkCircleOutline,
      gridOutline,
      homeOutline,
      leafOutline,
      locationOutline,
      personOutline,
      saveOutline,
      settingsOutline,
      wifiOutline
    });
  }

  async ngOnInit() {
    await this.loadSummary();
  }

  async ionViewWillEnter() {
    await this.loadSummary();
  }

  private async loadSummary() {
    const [planes, tareas] = await Promise.all([
      this.siembraStorage.obtenerSiembras(),
      this.tareaStorage.obtenerTareas()
    ]);
    const serviceState = this.getStoredServiceState();
    const activeServices = Object.values(serviceState).filter((service) => service.enabled).length;
    const activePlans = planes.filter((plan) => (plan.estado ?? 'activo') === 'activo');

    this.activePlans = activePlans.length;
    this.inactivePlans = planes.length - activePlans.length;
    this.pendingTasks = tareas.filter((tarea) => tarea.estado === 'pendiente').length;
    this.totalArea = this.sumArea(activePlans);
    this.cropStats = this.buildCropStats(activePlans);

    this.metrics = [
      {
        labelKey: 'summary.active_plans',
        value: String(this.activePlans),
        detailKey: 'summary.enabled_now',
        icon: 'leaf-outline'
      },
      {
        labelKey: 'summary.total_area',
        value: `${this.formatNumber(this.totalArea)} ha`,
        detailKey: 'summary.planted_area',
        icon: 'home-outline'
      },
      {
        labelKey: 'summary.pending_tasks',
        value: String(this.pendingTasks),
        detailKey: 'summary.to_review',
        icon: 'grid-outline'
      },
      {
        labelKey: 'summary.active_services',
        value: String(activeServices),
        detailKey: 'summary.enabled_now',
        icon: 'checkmark-circle-outline'
      }
    ];

    this.services = [
      this.buildService('camera', 'summary.camera', 'camera-outline', serviceState),
      this.buildService('wifi', 'summary.wifi', 'wifi-outline', serviceState),
      this.buildService('storage', 'summary.storage', 'save-outline', serviceState),
      this.buildService('location', 'summary.location', 'location-outline', serviceState)
    ];
  }

  private buildService(key: string, title: string, icon: string, state: StoredServiceState): SummaryService {
    return {
      key,
      title,
      icon,
      enabled: state[key]?.enabled ?? false,
      status: state[key]?.status ?? 'Desactivada'
    };
  }

  private buildCropStats(planes: SiembraRegistro[]) {
    const totalArea = this.sumArea(planes);
    const grouped = planes.reduce((stats, plan) => {
      const cropName = this.getNombreCultivo(plan.codigo_cultivo);
      const current = stats.get(cropName) ?? { name: cropName, plans: 0, area: 0, percentage: 0 };

      current.plans += 1;
      current.area += Number(plan.superficie_siembra ?? 0);
      stats.set(cropName, current);

      return stats;
    }, new Map<string, CropStat>());

    return Array.from(grouped.values())
      .map((stat) => ({
        ...stat,
        percentage: totalArea > 0 ? Math.round((stat.area / totalArea) * 100) : 0
      }))
      .sort((a, b) => b.area - a.area || b.plans - a.plans);
  }

  private sumArea(planes: SiembraRegistro[]) {
    return planes.reduce((total, plan) => total + Number(plan.superficie_siembra ?? 0), 0);
  }

  getNombreCultivo(codigo: string) {
    return this.cultivos.find((cultivo) => cultivo.codigo === codigo)?.nombre ?? codigo;
  }

  formatNumber(value: number) {
    return new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: 2
    }).format(value);
  }

  private getStoredServiceState(): StoredServiceState {
    const storedState = localStorage.getItem(DEVICE_CONTROLS_STATE_KEY);

    if (!storedState) {
      return {};
    }

    try {
      return JSON.parse(storedState) as StoredServiceState;
    } catch {
      localStorage.removeItem(DEVICE_CONTROLS_STATE_KEY);
      return {};
    }
  }
}
