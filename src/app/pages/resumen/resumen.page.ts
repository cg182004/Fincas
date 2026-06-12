import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  checkmarkCircleOutline,
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

  constructor() {
    addIcons({
      barChartOutline,
      cameraOutline,
      checkmarkCircleOutline,
      homeOutline,
      leafOutline,
      locationOutline,
      personOutline,
      saveOutline,
      settingsOutline,
      wifiOutline
    });
  }

  ngOnInit() {
    this.loadSummary();
  }

  ionViewWillEnter() {
    this.loadSummary();
  }

  private loadSummary() {
    const serviceState = this.getStoredServiceState();
    const activeServices = Object.values(serviceState).filter((service) => service.enabled).length;

    this.metrics = [
      {
        labelKey: 'summary.farms',
        value: '4',
        detailKey: 'summary.registered_farms',
        icon: 'leaf-outline'
      },
      {
        labelKey: 'summary.plots',
        value: '8',
        detailKey: 'summary.available_plots',
        icon: 'home-outline'
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
