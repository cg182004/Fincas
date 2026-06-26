import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IonButton, IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  homeOutline,
  locationOutline,
  personOutline,
  settingsOutline
} from 'ionicons/icons';

interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationSettingsPlugin {
  open(): Promise<void>;
}

const LocationSettings = registerPlugin<LocationSettingsPlugin>('LocationSettings');
const LOCATION_SERVICE_ENABLED_KEY = 'appfincas.locationServiceEnabled';

@Component({
  selector: 'app-ubicacion',
  templateUrl: './ubicacion.page.html',
  styleUrls: ['./ubicacion.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, CommonModule, RouterLink, TranslatePipe]
})
export class UbicacionPage implements OnInit, OnDestroy {
  private resumeListener?: PluginListenerHandle;
  location?: CurrentLocation;
  mapUrl?: SafeResourceUrl;
  status = 'Buscando ubicacion actual...';
  loading = false;
  locationServiceEnabled = false;
  showLocationSettingsButton = false;

  constructor(private sanitizer: DomSanitizer) {
    addIcons({
      'bar-chart-outline': barChartOutline,
      'home-outline': homeOutline,
      'location-outline': locationOutline,
      'person-outline': personOutline,
      'settings-outline': settingsOutline
    });
  }

  ngOnInit() {
    void this.loadCurrentLocation();
    void this.watchAppResume();
  }

  ngOnDestroy() {
    void this.resumeListener?.remove();
  }

  async loadCurrentLocation() {
    this.loading = true;
    this.status = 'Buscando ubicacion actual...';
    this.showLocationSettingsButton = false;

    try {
      const location = await this.getCurrentLocation();
      this.location = location;
      this.locationServiceEnabled = true;
      this.setLocationServiceEnabled(true);
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=17&output=embed`
      );
      this.status = 'Ubicacion activa';
    } catch (error) {
      this.location = undefined;
      this.mapUrl = undefined;
      this.locationServiceEnabled = false;
      this.showLocationSettingsButton = true;
      this.setLocationServiceEnabled(false);
      this.status = error instanceof Error ? error.message : 'No se pudo obtener la ubicacion';
    } finally {
      this.loading = false;
    }
  }

  async openInGoogleMaps() {
    if (!this.location) {
      return;
    }

    await Browser.open({
      url: `https://www.google.com/maps/search/?api=1&query=${this.location.latitude},${this.location.longitude}`
    });
  }

  async openLocationSettings() {
    try {
      await LocationSettings.open();
    } catch {
      this.status = 'Abre la configuracion del telefono, activa la ubicacion y vuelve a la app.';
    }
  }

  private setLocationServiceEnabled(enabled: boolean) {
    localStorage.setItem(LOCATION_SERVICE_ENABLED_KEY, String(enabled));
  }

  private async watchAppResume() {
    this.resumeListener = await App.addListener('resume', () => {
      void this.loadCurrentLocation();
    });
  }

  private async getCurrentLocation(): Promise<CurrentLocation> {
    try {
      const permission = await Geolocation.requestPermissions();

      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        throw new Error('Permiso de ubicacion denegado');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: permission.location === 'granted',
        timeout: 20000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch {
      return await this.getBrowserLocation();
    }
  }

  private getBrowserLocation(): Promise<CurrentLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Activa la ubicacion del telefono e intenta otra vez'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => reject(new Error('Activa la ubicacion del telefono e intenta otra vez')),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    });
  }
}
