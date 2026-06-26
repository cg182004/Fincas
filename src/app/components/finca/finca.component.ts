import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, ToastController } from '@ionic/angular';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  IonToolbar } from '@ionic/angular/standalone';
import { SiembraStorageService } from 'src/app/services/siembra-storage.service';

@Component({
  selector: 'app-finca',
  templateUrl: './finca.component.html',
  styleUrls: ['./finca.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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

  mensaje = '';
  planEditandoId = '';
  formSubmitted = false;
  siembraForm = this.fb.group({
    codigo_plan_siembra: ['', Validators.required],
    fecha_propuesta: ['', Validators.required],
    codigo_finca: ['', Validators.required],
    codigo_cultivo: ['', Validators.required],
    superficie_siembra: [null as number | null, [Validators.required, Validators.min(0.01)]],
    ph_suelo: [null as number | null, [Validators.required, Validators.min(0), Validators.max(14)]],
    textura_suelo: ['', [Validators.required, Validators.minLength(3)]],
    materia_organica: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    vel_infiltracion_min: [null as number | null, [Validators.required, Validators.min(0)]],
    vel_infiltracion_max: [null as number | null, [Validators.required, Validators.min(0)]],
    codigo_insumo: [''],
    estado: ['activo' as 'activo' | 'inactivo', Validators.required],
  }, {
    validators: this.infiltrationRangeValidator
  });

  constructor(
    private fb: FormBuilder,
    private siembraStorage: SiembraStorageService,
    private toastController: ToastController,
    private alterController: AlertController,
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
  
  async confirmarGuardarSiembra(){
   this.formSubmitted = true;

   if (this.siembraForm.invalid) {
     this.siembraForm.markAllAsTouched();
     this.mensaje = 'Revisa los campos marcados';
     await this.presentToast();
     return;
   }

   const alert = await this.alterController.create({
   header: 'Confirmar',
   message: 'Estás seguro que quieres guardar este plan de siembra?',
   buttons: [
   {
     text: 'cancelar',
     role: 'cancel',
   },
   { 
    text: 'si, guardar',
    handler: async () => {
      await this.guardarSiembra();
    },
   },
   ],
   });
   await alert.present();
  }

  async guardarSiembra() {
    const siembra = this.getSiembraFormValue();

    if (this.planEditandoId) {
      await this.siembraStorage.actualizarSiembra(this.planEditandoId, siembra);
      this.mensaje = 'Actualizado con exito';
      await this.presentToast();
      await this.router.navigate(['/planes', this.planEditandoId]);
      return;
    }

    await this.siembraStorage.guardarSiembra(siembra);
    const registros = await this.siembraStorage.obtenerSiembras();
    console.log('Siembras guardadas:', registros);

    this.mensaje = 'Guardado con exito';

    await this.presentToast();
    await this.limpiarFormulario();
    this.formSubmitted = false;
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
    const codigoPlan = await this.siembraStorage.generarCodigoPlanSiembra();
    this.siembraForm.patchValue({
      codigo_plan_siembra: codigoPlan
    });
  }

  private async cargarPlanParaEditar(id: string) {
    const plan = await this.siembraStorage.obtenerSiembraPorId(id);

    if (!plan) {
      await this.prepararNuevoPlan();
      return;
    }

    this.planEditandoId = id;
    this.siembraForm.patchValue({
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
    });
  }

  private async limpiarFormulario() {
    this.siembraForm.reset({
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
    });

    await this.prepararNuevoPlan();
  }

  isInvalid(controlName: string) {
    const control = this.siembraForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.formSubmitted);
  }

  soloNumerosDecimales(controlName: string, event: Event) {
    const input = event.target as HTMLIonInputElement | null;
    const rawValue = String(input?.value ?? '');
    const cleanValue = rawValue
      .replace(/,/g, '.')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    if (rawValue !== cleanValue) {
      this.siembraForm.get(controlName)?.setValue(cleanValue as never);
    }
  }

  hasError(controlName: string, errorName: string) {
    return this.siembraForm.get(controlName)?.hasError(errorName) ?? false;
  }

  get infiltrationRangeInvalid() {
    const min = this.siembraForm.get('vel_infiltracion_min');
    const max = this.siembraForm.get('vel_infiltracion_max');

    return this.siembraForm.hasError('infiltrationRange')
      && (!!min?.dirty || !!min?.touched || !!max?.dirty || !!max?.touched || this.formSubmitted);
  }

  private getSiembraFormValue() {
    const value = this.siembraForm.getRawValue();

    return {
      codigo_plan_siembra: value.codigo_plan_siembra ?? '',
      fecha_propuesta: value.fecha_propuesta ?? '',
      codigo_finca: value.codigo_finca ?? '',
      codigo_cultivo: value.codigo_cultivo ?? '',
      superficie_siembra: this.toNumberOrNull(value.superficie_siembra),
      ph_suelo: this.toNumberOrNull(value.ph_suelo),
      textura_suelo: value.textura_suelo ?? '',
      materia_organica: this.toNumberOrNull(value.materia_organica),
      vel_infiltracion_min: this.toNumberOrNull(value.vel_infiltracion_min),
      vel_infiltracion_max: this.toNumberOrNull(value.vel_infiltracion_max),
      codigo_insumo: value.codigo_insumo ?? '',
      estado: value.estado ?? 'activo',
    };
  }

  private toNumberOrNull(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return Number(value);
  }

  private infiltrationRangeValidator(control: AbstractControl): ValidationErrors | null {
    const min = control.get('vel_infiltracion_min')?.value;
    const max = control.get('vel_infiltracion_max')?.value;

    if (min === null || min === undefined || min === '' || max === null || max === undefined || max === '') {
      return null;
    }

    return Number(min) > Number(max) ? { infiltrationRange: true } : null;
  }
}
