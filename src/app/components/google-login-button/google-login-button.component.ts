import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  imports: [IonButton, TranslatePipe],
  templateUrl: './google-login-button.component.html',
  styleUrls: ['./google-login-button.component.scss']
})
export class GoogleLoginButtonComponent {
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async loginGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const data = await this.authService.loginWithGoogle();

      if (data.url) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: data.url });
          return;
        }

        window.location.assign(data.url);
      }
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesion con Google.';
      console.error('No se pudo iniciar sesion:', error);
    }
  }
}
