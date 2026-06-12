import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { GoogleLoginButtonComponent } from '../google-login-button/google-login-button.component';
import { AuthService } from '../../services/auth';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonText,
    GoogleLoginButtonComponent,
    TranslatePipe
  ],
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.scss'],
})
export class LoginCardComponent {
  mode: AuthMode = 'login';
  mostrarPassword = false;
  mostrarConfirmPassword = false;
  identifier = '';
  email = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  genero = '';
  nombreUsuario = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({
      'eye-off-outline': eyeOffOutline,
      'eye-outline': eyeOutline
    });
  }

  get submitLabel() {
    return this.mode === 'login' ? 'login.login' : 'login.register';
  }

  get helperText() {
    return this.mode === 'login' ? 'login.helper_login' : 'login.helper_register';
  }

  changeMode(value: string | number | undefined) {
    if (value !== 'login' && value !== 'register') {
      return;
    }

    this.mode = value;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async submitEmailAuth() {
    if (this.mode === 'login') {
      await this.submitLogin();
      return;
    }

    await this.submitRegister();
  }

  private async submitLogin() {
    if (!this.identifier || !this.password) {
      this.errorMessage = this.translate.instant('login.errors.missing_login');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = this.translate.instant('login.errors.short_password');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const data = await this.authService.loginWithEmailOrUsername(
        this.identifier.trim(),
        this.password
      );

      if (data.session) {
        await this.router.navigateByUrl('/home');
        return;
      }
    } catch (error) {
      this.errorMessage = this.getFriendlyError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async submitRegister() {
    if (
      !this.nombre ||
      !this.apellido ||
      !this.fechaNacimiento ||
      !this.genero ||
      !this.nombreUsuario ||
      !this.email ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = this.translate.instant('login.errors.missing_register');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = this.translate.instant('login.errors.short_password');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = this.translate.instant('login.errors.password_mismatch');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const data = await this.authService.registerWithEmail(
        this.email.trim(),
        this.password,
        {
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          fechaNacimiento: this.fechaNacimiento,
          genero: this.genero,
          nombreUsuario: this.nombreUsuario.trim()
        }
      );

      if (data.session) {
        await this.router.navigateByUrl('/home');
        return;
      }

      this.successMessage = this.translate.instant('login.success.created');
    } catch (error) {
      this.errorMessage = this.getFriendlyError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private getFriendlyError(error: unknown) {
    if (!(error instanceof Error)) {
      return this.translate.instant('login.errors.generic');
    }

    if (error.message.includes('Invalid login credentials')) {
      return this.translate.instant('login.errors.invalid_credentials');
    }

    if (error.message.includes('Username not found')) {
      return this.translate.instant('login.errors.username_not_found');
    }

    if (error.message.includes('User already registered')) {
      return this.translate.instant('login.errors.email_registered');
    }

    return error.message;
  }

}
