import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, ToastController } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTabBar,
  IonTabButton,
  IonTextarea
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  homeOutline,
  imagesOutline,
  locationOutline,
  personOutline,
  settingsOutline,
  trashOutline
} from 'ionicons/icons';
import {
  CatalogoFincaRegistro,
  CatalogoFincasStorageService
} from 'src/app/services/catalogo-fincas-storage.service';

interface FincaCatalogo {
  codigo: string;
  nombre: string;
}

interface CultivoCatalogo {
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-catalogo-fincas',
  templateUrl: './catalogo-fincas.page.html',
  styleUrls: ['./catalogo-fincas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTabBar,
    IonTabButton,
    IonTextarea,
    RouterLink,
    TranslatePipe
  ]
})
export class CatalogoFincasPage implements OnInit {
  cameraSource = CameraSource;

  fincas: FincaCatalogo[] = [
    { codigo: 'FINCA-001', nombre: 'Finca La Esperanza' },
    { codigo: 'FINCA-002', nombre: 'Finca San Jose' },
    { codigo: 'FINCA-003', nombre: 'Finca Los Pinos' },
  ];

  cultivos: CultivoCatalogo[] = [
    { codigo: 'CULT-001', nombre: 'Platano' },
    { codigo: 'CULT-002', nombre: 'Cacao' },
    { codigo: 'CULT-003', nombre: 'Maiz' },
  ];

  etapas = [
    'Preparacion del suelo',
    'Siembra',
    'Germinacion',
    'Crecimiento vegetativo',
    'Floracion',
    'Fructificacion',
    'Cosecha'
  ];

  registros: CatalogoFincaRegistro[] = [];
  codigoFinca = this.fincas[0].codigo;
  codigoCultivo = this.cultivos[0].codigo;
  etapa = this.etapas[0];
  observacion = '';
  fotoDataUrl = '';
  filtroFinca = 'todas';
  guardando = false;

  constructor(
    private catalogoStorage: CatalogoFincasStorageService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      barChartOutline,
      cameraOutline,
      homeOutline,
      imagesOutline,
      locationOutline,
      personOutline,
      settingsOutline,
      trashOutline
    });
  }

  async ngOnInit() {
    await this.cargarRegistros();
  }

  async ionViewWillEnter() {
    await this.cargarRegistros();
  }

  get registrosFiltrados() {
    if (this.filtroFinca === 'todas') {
      return this.registros;
    }

    return this.registros.filter((registro) => registro.codigo_finca === this.filtroFinca);
  }

  get puedeGuardar() {
    return !!this.codigoFinca && !!this.codigoCultivo && !!this.etapa && !!this.fotoDataUrl && !this.guardando;
  }

  async tomarFoto(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        quality: 75,
        resultType: CameraResultType.DataUrl,
        source,
        width: 1200,
        height: 1200
      });

      this.fotoDataUrl = photo.dataUrl ?? '';
    } catch (error) {
      await this.mostrarToast('No se pudo cargar la foto');
    }
  }

  async guardarRegistro() {
    if (!this.puedeGuardar) {
      await this.mostrarToast('Selecciona finca, cultivo, etapa y foto');
      return;
    }

    this.guardando = true;

    try {
      const finca = this.getFinca(this.codigoFinca);
      const cultivo = this.getCultivo(this.codigoCultivo);

      await this.catalogoStorage.guardarRegistro({
        codigo_finca: this.codigoFinca,
        nombre_finca: finca?.nombre ?? this.codigoFinca,
        codigo_cultivo: this.codigoCultivo,
        nombre_cultivo: cultivo?.nombre ?? this.codigoCultivo,
        etapa: this.etapa,
        observacion: this.observacion.trim(),
        foto_data_url: this.fotoDataUrl
      });

      await this.cargarRegistros();
      this.limpiarFormulario();
      await this.mostrarToast('Foto agregada al catalogo');
    } finally {
      this.guardando = false;
    }
  }

  async confirmarEliminar(registro: CatalogoFincaRegistro) {
    const alert = await this.alertController.create({
      header: 'Eliminar foto',
      message: `Quitar la foto de ${registro.nombre_finca} en etapa ${registro.etapa}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.catalogoStorage.eliminarRegistro(registro.id);
            await this.cargarRegistros();
            await this.mostrarToast('Foto eliminada');
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  private async cargarRegistros() {
    this.registros = await this.catalogoStorage.obtenerRegistros();
  }

  private limpiarFormulario() {
    this.etapa = this.etapas[0];
    this.observacion = '';
    this.fotoDataUrl = '';
  }

  private getFinca(codigo: string) {
    return this.fincas.find((finca) => finca.codigo === codigo);
  }

  private getCultivo(codigo: string) {
    return this.cultivos.find((cultivo) => cultivo.codigo === codigo);
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'middle',
      cssClass: 'toast-bonito'
    });

    await toast.present();
  }
}
