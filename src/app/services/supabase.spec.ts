import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  getClient() {
    return supabase;
  }
}