import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models';

const TOKEN_KEY = 'sahl_token';
const USER_KEY = 'sahl_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly userSignal = signal<LoginResponse | null>(this.readUser());

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUser = computed(() => this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'Admin');

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/Auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response));
        this.tokenSignal.set(response.token);
        this.userSignal.set(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): LoginResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      return null;
    }
  }
}
