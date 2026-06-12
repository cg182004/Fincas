import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SiembraStorageService } from 'src/app/services/siembra-storage.service';

@Component({
  selector: 'app-finca',
  templateUrl: './finca.component.html',
  styleUrls: ['./finca.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class FincaComponent implements OnInit {
  selectDerechaOptions = {
    cssClass: 'select-right-popover',
  };

  fincas = [
    { codigo: 'FINCA-001', nombre: 'Finca La Esperanza' },
    { codigo: 'FINCA-002', nombre: 'Finca San Jose' },
    { codigo: 'FINCA-003', nombre: 'Finca Los Pinos' },
  ];

  cultivos = [
    { codigo: 'CULT-001', nombre: 'Platano' },
    { codigo: 'CULT-002', nombre: 'Cacao' },
    { codigo: 'CULT-003', nombre: 'Maiz' },
  ];

  siembra = {
    codigo_plan_siembra: '',
    fecha_propuesta: '',
    codigo_finca: '',
    codigo_cultivo: '',
    superficie_siembra: null as number | null,
    ph_suelo: null as number | null,
    textura_suelo: '',
    materia_organica: null as number | null,
    vel_infiltracion_min: null as number | null,
    vel_infiltracion_max: null as number | null,
    codigo_insumo: '',
    estado: 'activo' as 'activo' | 'inactivo',
  };

  mensaje = '';
  planEditandoId = '';

  constructor(
    private siembraStorage: SiembraStorageService,
    private toastController: ToastController,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      await this.cargarPlanParaEditar(id);
      return;
    }

    await this.prepararNuevoPlan();
  }

  async guardarSiembra() {
    if (this.planEditandoId) {
      await this.siembraStorage.actualizarSiembra(this.planEditandoId, this.siembra);
      this.mensaje = 'Actualizado con exito';
      await this.presentToast();
      await this.router.navigate(['/planes', this.planEditandoId]);
      return;
    }

    await this.siembraStorage.guardarSiembra(this.siembra);
    const registros = await this.siembraStorage.obtenerSiembras();
    console.log('Siembras guardadas:', registros);

    this.mensaje = 'Guardado con exito';

    await this.presentToast();
    await this.limpiarFormulario();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: this.mensaje,
      duration: 2000,
      position: 'middle',
      cssClass: 'toast-bonito',
    });

    await toast.present();
  }
  async exportarJson() {
    const registros = await this.siembraStorage.obtenerSiembras();
    const contenido = JSON.stringify({ planes: registros }, null, 2);
    const archivo = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'planes_siembra.json';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private async prepararNuevoPlan() {
    this.siembra.codigo_plan_siembra =
      await this.siembraStorage.generarCodigoPlanSiembra();
  }

  private async cargarPlanParaEditar(id: string) {
    const plan = await this.siembraStorage.obtenerSiembraPorId(id);

    if (!plan) {
      await this.prepararNuevoPlan();
      return;
    }

    this.planEditandoId = id;
    this.siembra = {
      codigo_plan_siembra: plan.codigo_plan_siembra,
      fecha_propuesta: plan.fecha_propuesta,
      codigo_finca: plan.codigo_finca,
      codigo_cultivo: plan.codigo_cultivo,
      superficie_siembra: plan.superficie_siembra,
      ph_suelo: plan.ph_suelo,
      textura_suelo: plan.textura_suelo,
      materia_organica: plan.materia_organica,
      vel_infiltracion_min: plan.vel_infiltracion_min,
      vel_infiltracion_max: plan.vel_infiltracion_max,
      codigo_insumo: plan.codigo_insumo,
      estado: plan.estado ?? 'activo',
    };
  }

  private async limpiarFormulario() {
    this.siembra = {
      codigo_plan_siembra: '',
      fecha_propuesta: '',
      codigo_finca: '',
      codigo_cultivo: '',
      superficie_siembra: null,
      ph_suelo: null,
      textura_suelo: '',
      materia_organica: null,
      vel_infiltracion_min: null,
      vel_infiltracion_max: null,
      codigo_insumo: '',
      estado: 'activo',
    };

    await this.prepararNuevoPlan();
  }
}
