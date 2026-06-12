import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';
import { Geolocation, CallbackID } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, IonToggle, IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  homeOutline,
  locationOutline,
  personOutline,
  saveOutline,
  settingsOutline,
  wifiOutline
} from 'ionicons/icons';

type DeviceControlKey = 'camera' | 'wifi' | 'storage' | 'location';

interface DeviceControl {
  key: DeviceControlKey;
  title: string;
  detail: string;
  icon: string;
  enabled: boolean;
  status: string;
}

interface LocationReading {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface StorageInfoResult {
  availableBytes: number;
  freeBytes: number;
  totalBytes: number;
}

interface StorageInfoPlugin {
  getStorageInfo(): Promise<StorageInfoResult>;
}

interface LocationSettingsPlugin {
  open(): Promise<void>;
}

const StorageInfo = registerPlugin<StorageInfoPlugin>('StorageInfo');
const LocationSettings = registerPlugin<LocationSettingsPlugin>('LocationSettings');
const LOCATION_SERVICE_ENABLED_KEY = 'appfincas.locationServiceEnabled';
const DEVICE_CONTROLS_STATE_KEY = 'appfincas.deviceControlsState';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.page.html',
  styleUrls: ['./servicios.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, IonToggle, CommonModule, RouterLink, TranslatePipe, LanguageSwitcherComponent]
})
export class ServiciosPage implements OnInit {
  private locationWatchId?: CallbackID;
  private networkListener?: PluginListenerHandle;
  lastLocation?: LocationReading;
  showLocationSettingsButton = false;

  deviceControls: DeviceControl[] = [
    {
      key: 'camera',
      title: 'Camara',
      detail: 'Prueba la camara del telefono',
      icon: 'camera-outline',
      enabled: false,
      status: 'Lista para probar'
    },
    {
      key: 'wifi',
      title: 'Wifi',
      detail: 'Estado de conexion de red',
      icon: 'wifi-outline',
      enabled: false,
      status: 'Sin verificar'
    },
    {
      key: 'storage',
      title: 'Memoria interna',
      detail: 'Verificar el estado de la memoria',
      icon: 'save-outline',
      enabled: false,
      status: 'Desactivada'
    },
    {
      key: 'location',
      title: 'Ubicacion',
      detail: 'Permiso para leer ubicacion',
      icon: 'location-outline',
      enabled: false,
      status: 'Desactivada'
    }
  ];

  constructor() {
    addIcons({
      'bar-chart-outline': barChartOutline,
      'camera-outline': cameraOutline,
      'home-outline': homeOutline,
      'location-outline': locationOutline,
      'person-outline': personOutline,
      'save-outline': saveOutline,
      'settings-outline': settingsOutline,
      'wifi-outline': wifiOutline
    });
  }

  ngOnInit() {
    this.restoreDeviceControlsState();
  }

  async toggleDevice(controlKey: DeviceControlKey, enabled: boolean) {
    const control = this.deviceControls.find((item) => item.key === controlKey);

    if (!control) {
      return;
    }

    if (!enabled) {
      await this.disableDevice(control);
      return;
    }

    control.enabled = true;
    control.status = 'Activando...';

    try {
      if (controlKey === 'camera') {
        await this.enableCamera(control);
      }

      if (controlKey === 'wifi') {
        await this.enableWifi(control);
      }

      if (controlKey === 'storage') {
        await this.enableStorage(control);
      }

      if (controlKey === 'location') {
        this.showLocationSettingsButton = false;
        this.setLocationServiceEnabled(false);
        await this.enableLocation(control);
      }

      this.saveDeviceControlsState();
    } catch (error) {
      control.enabled = false;
      control.status = error instanceof Error ? error.message : 'No se pudo activar';

      if (controlKey === 'location') {
        this.showLocationSettingsButton = true;
        this.setLocationServiceEnabled(false);
      }

      this.saveDeviceControlsState();
    }
  }

  async testCamera(control: DeviceControl) {
    control.status = 'Abriendo camara...';

    try {
      await this.enableCamera(control);
      control.enabled = false;
      control.status = 'Camara probada';
    } catch (error) {
      control.enabled = false;
      control.status = error instanceof Error ? error.message : 'No se pudo abrir la camara';
    }
  }

  async openLocationMap() {
    if (!this.lastLocation) {
      return;
    }

    const { latitude, longitude } = this.lastLocation;

    await Browser.open({
      url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
  }

  async openLocationSettings() {
    try {
      await LocationSettings.open();
    } catch {
      await Browser.open({ url: 'android.settings.LOCATION_SOURCE_SETTINGS' });
    }
  }

  private async enableCamera(control: DeviceControl) {
    const permission = await Camera.requestPermissions({
      permissions: ['camera']
    });

    if (permission.camera !== 'granted') {
      throw new Error('Permiso de camara denegado');
    }

    await Camera.getPhoto({
      quality: 70,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });

    control.enabled = true;
    control.status = 'Activa';
  }

  private async enableWifi(control: DeviceControl) {
    const status = await Network.getStatus();

    await this.networkListener?.remove();
    this.networkListener = await Network.addListener('networkStatusChange', (networkStatus) => {
      control.enabled = true;
      control.status = networkStatus.connected
        ? `Hay internet por ${this.getConnectionName(networkStatus.connectionType)}`
        : 'No hay internet';
    });

    control.enabled = true;
    control.status = status.connected
      ? `Hay internet por ${this.getConnectionName(status.connectionType)}`
      : 'No hay internet';
  }

  private async enableStorage(control: DeviceControl) {
    const storageInfo = await this.getStorageInfo();

    if (!storageInfo) {
      throw new Error('No se pudo consultar el espacio');
    }

    control.enabled = true;
    control.status = `Disponible: ${this.formatBytes(storageInfo.availableBytes)} de ${this.formatBytes(storageInfo.totalBytes)}`;
  }

  private async enableLocation(control: DeviceControl) {
    const permission = await Geolocation.requestPermissions();

    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      throw new Error('Permiso de ubicacion denegado');
    }

    try {
      if (this.locationWatchId) {
        await Geolocation.clearWatch({ id: this.locationWatchId });
      }

      control.status = 'Buscando ubicacion...';

      const currentPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: permission.location === 'granted',
        timeout: 20000,
        maximumAge: 0
      });

      this.setLocationStatus(control, currentPosition.coords.latitude, currentPosition.coords.longitude, currentPosition.coords.accuracy);

      this.locationWatchId = await Geolocation.watchPosition({
        enableHighAccuracy: permission.location === 'granted',
        timeout: 15000,
        minimumUpdateInterval: 5000
      }, (position, error) => {
        if (error || !position) {
          control.enabled = false;
          control.status = 'Activa la ubicacion del telefono e intenta otra vez';
          return;
        }

        this.setLocationStatus(control, position.coords.latitude, position.coords.longitude, position.coords.accuracy);
      });
    } catch {
      throw new Error('Activa la ubicacion del telefono e intenta otra vez');
    }
  }

  private async disableDevice(control: DeviceControl) {
    if (control.key === 'wifi') {
      await this.networkListener?.remove();
      this.networkListener = undefined;
    }

    if (control.key === 'location' && this.locationWatchId) {
      await Geolocation.clearWatch({ id: this.locationWatchId });
      this.locationWatchId = undefined;
      this.lastLocation = undefined;
      this.showLocationSettingsButton = false;
    }

    if (control.key === 'location') {
      this.setLocationServiceEnabled(false);
    }

    control.enabled = false;
    control.status = 'Desactivada';
    this.saveDeviceControlsState();
  }

  private getConnectionName(connectionType: string) {
    if (connectionType === 'wifi') {
      return 'Wifi';
    }

    if (connectionType === 'cellular') {
      return 'Datos moviles';
    }

    return connectionType;
  }

  private setLocationStatus(control: DeviceControl, latitude: number, longitude: number, accuracy: number) {
    control.enabled = true;
    this.setLocationServiceEnabled(true);
    this.lastLocation = {
      latitude,
      longitude,
      accuracy
    };
    control.status = `Activa: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} | Precision: ${accuracy.toFixed(0)} m`;
  }

  private async getStorageInfo(): Promise<StorageInfoResult | undefined> {
    try {
      return await StorageInfo.getStorageInfo();
    } catch {
      const estimate = await navigator.storage?.estimate?.();

      if (!estimate?.quota || estimate.usage === undefined) {
        return undefined;
      }

      return {
        availableBytes: estimate.quota - estimate.usage,
        freeBytes: estimate.quota - estimate.usage,
        totalBytes: estimate.quota
      };
    }
  }

  private formatBytes(bytes: number) {
    const gigabytes = bytes / 1024 / 1024 / 1024;

    if (gigabytes >= 1) {
      return `${gigabytes.toFixed(2)} GB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  }

  private setLocationServiceEnabled(enabled: boolean) {
    localStorage.setItem(LOCATION_SERVICE_ENABLED_KEY, String(enabled));
  }

  private saveDeviceControlsState() {
    const state = this.deviceControls.reduce<Record<string, Pick<DeviceControl, 'enabled' | 'status'>>>((savedState, control) => {
      savedState[control.key] = {
        enabled: control.enabled,
        status: control.status
      };

      return savedState;
    }, {});

    localStorage.setItem(DEVICE_CONTROLS_STATE_KEY, JSON.stringify(state));
  }

  private restoreDeviceControlsState() {
    const storedState = localStorage.getItem(DEVICE_CONTROLS_STATE_KEY);

    if (!storedState) {
      return;
    }

    try {
      const state = JSON.parse(storedState) as Record<string, Pick<DeviceControl, 'enabled' | 'status'>>;

      this.deviceControls = this.deviceControls.map((control) => ({
        ...control,
        enabled: state[control.key]?.enabled ?? control.enabled,
        status: state[control.key]?.status ?? control.status
      }));
    } catch {
      localStorage.removeItem(DEVICE_CONTROLS_STATE_KEY);
    }
  }
}
