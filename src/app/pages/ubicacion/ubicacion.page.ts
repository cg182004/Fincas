import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
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

const LOCATION_SERVICE_ENABLED_KEY = 'appfincas.locationServiceEnabled';

@Component({
  selector: 'app-ubicacion',
  templateUrl: './ubicacion.page.html',
  styleUrls: ['./ubicacion.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonFooter, IonIcon, IonLabel, IonTabBar, IonTabButton, CommonModule, RouterLink, TranslatePipe]
})
export class UbicacionPage implements OnInit {
  location?: CurrentLocation;
  mapUrl?: SafeResourceUrl;
  status = 'Buscando ubicacion actual...';
  loading = false;
  locationServiceEnabled = false;

  constructor(private sanitizer: DomSanitizer, private router: Router) {
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
  }

  async loadCurrentLocation() {
    this.locationServiceEnabled = this.isLocationServiceEnabled();

    if (!this.locationServiceEnabled) {
      this.location = undefined;
      this.mapUrl = undefined;
      this.loading = false;
      this.status = 'Primero activa Ubicacion en Servicios';
      return;
    }

    this.loading = true;
    this.status = 'Buscando ubicacion actual...';

    try {
      const location = await this.getCurrentLocation();
      this.location = location;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=17&output=embed`
      );
      this.status = `Actual: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} | Precision: ${location.accuracy.toFixed(0)} m`;
    } catch (error) {
      this.location = undefined;
      this.mapUrl = undefined;
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

  goToServices() {
    void this.router.navigateByUrl('/servicios');
  }

  private isLocationServiceEnabled() {
    return localStorage.getItem(LOCATION_SERVICE_ENABLED_KEY) === 'true';
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
