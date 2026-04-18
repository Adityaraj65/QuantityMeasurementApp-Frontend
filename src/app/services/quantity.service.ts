import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080/api/v1/quantities';

export type MeasurementType = 'LengthUnit' | 'VolumeUnit' | 'WeightUnit' | 'TemperatureUnit';
export type Operation = 'compare' | 'convert' | 'arithmetic';
export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide';

export const UNITS: Record<MeasurementType, string[]> = {
  LengthUnit: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  VolumeUnit: ['LITRE', 'MILLILITRE', 'GALLON'],
  WeightUnit: ['KILOGRAM', 'GRAM', 'POUND'],
  TemperatureUnit: ['CELSIUS', 'FAHRENHEIT', 'KELVIN']
};

export interface QuantityPayload {
  firstQuantity: {
    value: number;
    unit: string;
    measurementType: MeasurementType;
  };
  secondQuantity: {
    value: number;
    unit: string;
    measurementType: MeasurementType;
  };
  targetUnit: string;
}

export interface QuantityResult {
  resultString?: string;
  resultValue?: number;
  errorMessage?: string;
}

type QuantityResponse = QuantityResult & {
  result?: number;
  value?: number;
  ResultValue?: number;
  result_value?: number;
  message?: string;
};

export interface HistoryItem {
  operation: string;
  thisValue: string | number;
  thatValue: string | number;
  resultString?: string;
  resultValue?: number;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  calculate(endpoint: Operation | MathOperation, payload: QuantityPayload): Observable<QuantityResult> {
    return this.http.post<QuantityResponse>(`${API_BASE}/${endpoint}`, payload, {
      headers: this.headers()
    }).pipe(
      map((response) => this.normalizeResult(response)),
      catchError((error) => this.handleError(error, 'Calculation failed'))
    );
  }

  history(type: MeasurementType): Observable<HistoryItem[]> {
    return this.http.get<HistoryItem[]>(`${API_BASE}/history/type/${type}`, {
      headers: this.headers()
    }).pipe(catchError((error) => this.handleError(error, 'Could not load history')));
  }

  private headers(): HttpHeaders {
    const token = this.authService.token;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private normalizeResult(response: QuantityResponse): QuantityResult {
    const resultValue = response.resultValue
      ?? response.result
      ?? response.value
      ?? response.ResultValue
      ?? response.result_value;

    return {
      ...response,
      resultString: response.resultString ?? response.message,
      resultValue
    };
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    if (error.status === 0) {
      return throwError(() => new Error(
        'Network/CORS error: the browser could not read the API response. Check that the Gateway allows this Angular origin and the Authorization header.'
      ));
    }

    const apiMessage = error.error?.errorMessage;
    const textMessage = typeof error.error === 'string' ? error.error : undefined;
    return throwError(() => new Error(apiMessage || textMessage || fallback));
  }
}
