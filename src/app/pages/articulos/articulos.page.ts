import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CapacitorHttp } from '@capacitor/core';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonLabel,
  IonSearchbar,
  IonSpinner,
  IonTabBar,
  IonTabButton
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cubeOutline,
  homeOutline,
  locationOutline,
  personOutline,
  pricetagOutline,
  searchOutline,
  settingsOutline
} from 'ionicons/icons';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, from, of, switchMap, tap, timeout } from 'rxjs';

interface ArticuloApi {
  articulo: string;
  marca: string | null;
  modelo: string | null;
  codigo_barra: string;
  costo: number;
  precio: number;
  precios: string;
  existencia: number;
  existencia_texto: string;
  id_articulo: number;
}

interface ArticulosResponse {
  articulos?: ArticuloApi[];
}

interface ArticuloView {
  articulo: string;
  marca: string;
  modelo: string;
  codigo_barra: string;
  costo: number;
  precio: number;
  precios: string;
  existencia: number;
  existencia_texto: string;
  id_articulo: number;
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'timeout' | 'error';

const ARTICULOS_URL = 'https://softecard.com/borrar.php';

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.page.html',
  styleUrls: ['./articulos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonLabel,
    IonSearchbar,
    IonSpinner,
    IonTabBar,
    IonTabButton,
    RouterLink,
    TranslatePipe
  ]
})
export class ArticulosPage implements OnInit, OnDestroy {
  searchText = '';
  articulos: ArticuloView[] = [];
  status: SearchStatus = 'idle';
  responseTimeMs?: number;

  private searchTerms = new Subject<string>();
  private searchSubscription?: Subscription;
  private activeSearchId = 0;

  constructor() {
    addIcons({
      barChartOutline,
      cubeOutline,
      homeOutline,
      locationOutline,
      personOutline,
      pricetagOutline,
      searchOutline,
      settingsOutline
    });
  }

  ngOnInit() {
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(700),
      distinctUntilChanged((previousTerm, currentTerm) => previousTerm.trim() === currentTerm.trim()),
      tap((term) => this.prepareSearch(term)),
      switchMap((term) => {
        const query = term.trim();
        const searchId = this.activeSearchId + 1;
        this.activeSearchId = searchId;
        const startedAt = performance.now();
        return from(this.fetchArticulos(query, searchId)).pipe(
          timeout(8000),
          tap(() => {
            this.responseTimeMs = Math.round(performance.now() - startedAt);
          }),
          catchError((error) => {
            this.responseTimeMs = Math.round(performance.now() - startedAt);
            this.status = error?.name === 'TimeoutError' ? 'timeout' : 'error';
            this.articulos = [];
            return of(null);
          })
        );
      })
    ).subscribe((response) => {
      if (!response) {
        return;
      }

      this.articulos = this.mapArticulos(response.articulos ?? []);
      this.status = this.articulos.length > 0 ? 'success' : 'empty';
    });

    this.searchTerms.next('');
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string | null | undefined) {
    this.searchText = value ?? '';
    this.searchTerms.next(this.searchText);
  }

  get resultCount() {
    return this.articulos.length;
  }

  get totalExistencia() {
    return this.articulos.reduce((total, articulo) => total + Number(articulo.existencia || 0), 0);
  }

  getProfit(articulo: ArticuloView) {
    return Number(articulo.precio || 0) - Number(articulo.costo || 0);
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(value || 0);
  }

  private prepareSearch(term: string) {
    this.responseTimeMs = undefined;
    this.status = 'loading';
  }

  private async fetchArticulos(query: string, searchId: number): Promise<ArticulosResponse | null> {
    const response = await CapacitorHttp.get({
      url: ARTICULOS_URL,
      params: {
        t: 'Articulo_Lista_Select',
        consulta: query
      },
      responseType: 'text'
    });

    if (searchId !== this.activeSearchId) {
      return null;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Respuesta invalida: ${response.status}`);
    }

    if (typeof response.data === 'string') {
      return this.parseArticulosResponse(response.data);
    }

    return response.data as ArticulosResponse;
  }

  private parseArticulosResponse(rawResponse: string): ArticulosResponse {
    const trimmedResponse = rawResponse.trim();

    if (!trimmedResponse) {
      return { articulos: [] };
    }

    const jsonStart = trimmedResponse.indexOf('{');
    const jsonEnd = trimmedResponse.lastIndexOf('}');

    if (jsonStart < 0 || jsonEnd < jsonStart) {
      throw new Error('La respuesta no contiene JSON');
    }

    return JSON.parse(trimmedResponse.slice(jsonStart, jsonEnd + 1)) as ArticulosResponse;
  }

  private mapArticulos(articulos: ArticuloApi[]): ArticuloView[] {
    return articulos.map((articulo) => ({
      articulo: this.cleanText(articulo.articulo) || 'Articulo sin nombre',
      marca: this.cleanText(articulo.marca) || 'Sin marca',
      modelo: this.cleanText(articulo.modelo) || 'Sin modelo',
      codigo_barra: this.cleanText(articulo.codigo_barra),
      costo: Number(articulo.costo || 0),
      precio: Number(articulo.precio || 0),
      precios: this.cleanText(articulo.precios),
      existencia: this.getArticuloExistencia(articulo),
      existencia_texto: this.cleanText(articulo.existencia_texto),
      id_articulo: Number(articulo.id_articulo || 0)
    }));
  }

  private getArticuloExistencia(articulo: ArticuloApi) {
    const existencia = Number(articulo.existencia);

    if (Number.isFinite(existencia)) {
      return existencia;
    }

    const existenciaTexto = this.cleanText(articulo.existencia_texto);
    const match = existenciaTexto.match(/-?\d+(\.\d+)?/g);

    if (!match?.length) {
      return 0;
    }

    return Number(match[match.length - 1]) || 0;
  }

  private cleanText(value: string | null | undefined) {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .replace(/^\.+\s*/, '')
      .trim();
  }
}
