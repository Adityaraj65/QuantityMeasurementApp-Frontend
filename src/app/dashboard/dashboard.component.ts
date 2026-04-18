import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  HistoryItem,
  MathOperation,
  MeasurementType,
  Operation,
  QuantityService,
  UNITS
} from '../services/quantity.service';

interface CategoryOption {
  label: string;
  type: MeasurementType;
}

interface TabOption {
  label: string;
  op: Operation;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  readonly categories: CategoryOption[] = [
    { label: 'Length', type: 'LengthUnit' },
    { label: 'Volume', type: 'VolumeUnit' },
    { label: 'Weight', type: 'WeightUnit' },
    { label: 'Temp', type: 'TemperatureUnit' }
  ];

  readonly tabs: TabOption[] = [
    { label: 'Compare', op: 'compare' },
    { label: 'Convert', op: 'convert' },
    { label: 'Arithmetic', op: 'arithmetic' }
  ];

  currentType: MeasurementType = 'LengthUnit';
  currentOp: Operation = 'compare';
  mathOp: MathOperation = 'add';
  value1: number | null = null;
  value2: number | null = null;
  unit1 = UNITS.LengthUnit[0];
  unit2 = UNITS.LengthUnit[0];
  result = 'Ready...';
  resultValue: string | null = null;
  resultUnit: string | null | undefined = null;
  historyItems: HistoryItem[] = [];
  isHistoryOpen = false;

  constructor(
    public readonly authService: AuthService,
    private readonly quantityService: QuantityService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get units(): string[] {
    return UNITS[this.currentType];
  }

  get opSymbol(): string {
    if (this.currentOp === 'convert') {
      return 'TO';
    }

    if (this.currentOp === 'arithmetic') {
      return 'OP';
    }

    return 'VS';
  }

  get resultLabel(): string {
    return this.resultUnit ? `Result in ${this.resultUnit}` : 'Result';
  }

  selectCategory(type: MeasurementType): void {
    this.currentType = type;
    this.unit1 = this.units[0];
    this.unit2 = this.units[0];
  }

  selectOperation(op: Operation): void {
    this.currentOp = op;
  }

  calculate(): void {
    if (this.value1 === null || Number.isNaN(this.value1)) {
      this.showResultMessage('Enter a value first!');
      return;
    }

    const operation = this.currentOp;
    const firstUnit = this.unit1.toUpperCase();
    const targetUnit = this.unit2.toUpperCase();
    const endpoint = operation === 'arithmetic' ? this.mathOp : operation;
    const payload = {
      firstQuantity: {
        value: this.value1,
        unit: firstUnit,
        measurementType: this.currentType
      },
      secondQuantity: {
        value: this.value2 ?? 0,
        unit: targetUnit,
        measurementType: this.currentType
      },
      targetUnit
    };

    this.showResultMessage('Calculating...');
    this.cdr.detectChanges();

    this.quantityService.calculate(endpoint, payload).subscribe({
      next: (data) => {
        if (operation === 'compare') {
          this.showResultMessage(this.isMatch(data.resultString) ? 'MATCH' : 'NO MATCH');
          this.cdr.detectChanges();
          return;
        }

        if (typeof data.resultValue !== 'number') {
          console.error('Calculation response is missing resultValue:', data);
          this.showResultMessage('Cannot perform operation now. Please try again later.');
          this.cdr.detectChanges();
          return;
        }

        const resultValue = data.resultValue;
        this.result = '';
        this.resultValue = resultValue.toFixed(2);
        this.resultUnit = data.resultUnit;
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        console.error(error);
        this.showResultMessage(error.message || 'Cannot perform operation now. Please try again later.');
        this.cdr.detectChanges();
      }
    });
  }

  openHistory(): void {
    if (!this.authService.isLoggedIn) {
      alert('Please Login to view your history.');
      return;
    }

    this.isHistoryOpen = true;
    this.quantityService.history(this.currentType).subscribe({
      next: (history) => {
        this.historyItems = history;
      },
      error: () => {
        alert('Cannot load history now. Please try again later.');
      }
    });
  }

  closeHistory(): void {
    this.isHistoryOpen = false;
  }

  authAction(): void {
    if (this.authService.isLoggedIn) {
      this.authService.logout();
      window.location.reload();
      return;
    }

    void this.router.navigateByUrl('/auth');
  }

  formatHistoryResult(item: HistoryItem): string {
    if (item.operation === 'COMPARE') {
      return item.resultString ?? '';
    }

    return typeof item.resultValue === 'number' ? item.resultValue.toFixed(2) : '';
  }

  private isMatch(result: string | undefined): boolean {
    return result?.toLowerCase() === 'true' || result?.toUpperCase() === 'MATCH';
  }

  private showResultMessage(message: string): void {
    this.result = message;
    this.resultValue = null;
    this.resultUnit = null;
  }
}
