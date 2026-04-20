import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API_BASE = `${environment.apiUrl}/api/v1/quantities`;

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
  resultUnit?: string;
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
    const headers = this.headers();

    const invalidFields = this.findInvalidPayloadFields(payload);

    if (invalidFields.length > 0) {
      console.error('Quantity request has missing fields:', invalidFields, payload);
      return throwError(() => new Error('Please fill all required quantity fields before calculating.'));
    }

    console.log('Quantity request payload:', payload);

    return this.http.post<QuantityResponse>(`${API_BASE}/${endpoint}`, payload, {
      headers,
      withCredentials: true
    }).pipe(
      map((response) => this.normalizeResult(response)),
      catchError((error) => this.handleError(error, 'Cannot perform operation now. Please try again later.'))
    );
  }

  history(type: MeasurementType): Observable<HistoryItem[]> {
    const headers = this.headers();

    if (!headers.has('user-email')) {
      console.error('History request is missing required user-email header.');
      return throwError(() => new Error('Please login again before viewing history.'));
    }

    return this.http.get<HistoryItem[]>(`${API_BASE}/history/type/${type}`, {
      headers,
      withCredentials: true
    }).pipe(catchError((error) => this.handleError(error, 'Cannot load history now. Please try again later.')));
  }

  private headers(): HttpHeaders {
    const token = this.authService.token;
    const userEmail = this.authService.userEmail;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (userEmail) {
      headers = headers.set('user-email', userEmail);
    }

    return headers;
  }

  private normalizeResult(response: QuantityResponse): QuantityResult {
    const resultValue = response.resultValue
      ?? response.result
      ?? response.value
      ?? response.ResultValue
      ?? response.result_value;
    const resultUnit = response.resultUnit;

    return {
      ...response,
      resultString: response.resultString ?? response.message,
      resultValue,
      resultUnit
    };
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    console.error('Quantity API error:', error);
    return throwError(() => new Error(fallback));
  }

  private findInvalidPayloadFields(payload: QuantityPayload): string[] {
    const invalidFields: string[] = [];

    if (
      payload.firstQuantity.value === null
      || payload.firstQuantity.value === undefined
      || Number.isNaN(payload.firstQuantity.value)
    ) {
      invalidFields.push('firstQuantity.value');
    }

    if (!payload.firstQuantity.unit) {
      invalidFields.push('firstQuantity.unit');
    }

    if (!payload.firstQuantity.measurementType) {
      invalidFields.push('firstQuantity.measurementType');
    }

    if (
      payload.secondQuantity.value === null
      || payload.secondQuantity.value === undefined
      || Number.isNaN(payload.secondQuantity.value)
    ) {
      invalidFields.push('secondQuantity.value');
    }

    if (!payload.secondQuantity.unit) {
      invalidFields.push('secondQuantity.unit');
    }

    if (!payload.secondQuantity.measurementType) {
      invalidFields.push('secondQuantity.measurementType');
    }

    if (!payload.targetUnit) {
      invalidFields.push('targetUnit');
    }

    return invalidFields;
  }
}
