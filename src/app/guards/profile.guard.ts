import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getSupabaseClient } from '../supabase.client';

export const profileGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = getSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user?.email) {
    return router.parseUrl('/login');
  }

  return true;
};
