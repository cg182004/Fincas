import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { getSupabaseClient } from './supabase.client';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private router: Router, private languageService: LanguageService) {
    this.languageService.init();
    this.listenForAuthRedirect();
  }

  private listenForAuthRedirect() {
    App.addListener('appUrlOpen', async ({ url }) => {
      await this.handleAuthRedirect(url);
    });

    App.getLaunchUrl().then(async (launchUrl) => {
      if (launchUrl?.url) {
        await this.handleAuthRedirect(launchUrl.url);
      }
    });
  }

  private async handleAuthRedirect(url: string) {
    if (!url.startsWith('io.ionic.starter://login-callback')) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await Browser.close();
    }

    const callbackUrl = new URL(url);
    const code = callbackUrl.searchParams.get('code');
    const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const supabase = getSupabaseClient();

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }

    await this.router.navigateByUrl('/home');
  }
}
