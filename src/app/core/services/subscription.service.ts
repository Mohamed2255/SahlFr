import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum SubscriptionStatus {
  Trial = 1,
  Active = 2,
  Expired = 3,
  Suspended = 4
}

export interface SubscriptionStatusDto {
  isRegistered: boolean;
  companyName: string;
  status: SubscriptionStatus;
  trialStartDate: string;
  trialEndDate: string;
  daysRemaining: number;
  isExpired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/subscription';

  getStatus(): Observable<SubscriptionStatusDto> {
    return this.http.get<SubscriptionStatusDto>(`${this.apiUrl}/status`);
  }

  registerCompany(companyName: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, { companyName });
  }

  extendTrial(days: number = 30): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/extend?days=${days}`, {});
  }

  activateSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/activate`, {});
  }

  suspendSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/suspend`, {});
  }
}
