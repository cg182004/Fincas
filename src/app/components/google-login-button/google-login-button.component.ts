import { Component, OnDestroy, OnInit } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
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
export class GoogleLoginButtonComponent implements OnInit, OnDestroy {
  isLoading = false;
  errorMessage = '';
  private browserFinishedListener?: PluginListenerHandle;
  private resetLoading = () => {
    this.isLoading = false;
  };
  private resetLoadingWhenVisible = () => {
    if (document.visibilityState === 'visible') {
      this.isLoading = false;
    }
  };

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    window.addEventListener('pageshow', this.resetLoading);
    document.addEventListener('visibilitychange', this.resetLoadingWhenVisible);

    if (Capacitor.isNativePlatform()) {
      this.browserFinishedListener = await Browser.addListener('browserFinished', this.resetLoading);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('pageshow', this.resetLoading);
    document.removeEventListener('visibilitychange', this.resetLoadingWhenVisible);
    void this.browserFinishedListener?.remove();
  }

  async loginGoogle() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    let isRedirecting = false;

    try {
      const data = await this.authService.loginWithGoogle();

      if (!data.url) {
        throw new Error('No se recibio la URL de Google.');
      }

      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.url });
        this.isLoading = false;
        return;
      }

      isRedirecting = true;
      window.location.assign(data.url);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesion con Google.';
      console.error('No se pudo iniciar sesion:', error);
    } finally {
      if (!isRedirecting) {
        this.isLoading = false;
      }
    }
  }
}
