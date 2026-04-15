import { Component } from '@angular/core';
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
  historyItems: HistoryItem[] = [];
  isHistoryOpen = false;

  constructor(
    public readonly authService: AuthService,
    private readonly quantityService: QuantityService,
    private readonly router: Router
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
      this.result = 'Enter a value first!';
      return;
    }

    const endpoint = this.currentOp === 'arithmetic' ? this.mathOp : this.currentOp;
    const payload = {
      firstQuantity: {
        value: this.value1,
        unit: this.unit1,
        measurementType: this.currentType
      },
      secondQuantity: {
        value: this.value2 ?? 0,
        unit: this.unit2,
        measurementType: this.currentType
      },
      targetUnit: this.unit2
    };

    this.quantityService.calculate(endpoint, payload).subscribe({
      next: (data) => {
        if (this.currentOp === 'compare') {
          this.result = data.resultString === 'true' ? 'MATCH' : 'NO MATCH';
          return;
        }

        const resultValue = data.resultValue ?? 0;
        this.result = `${resultValue.toFixed(2)} ${this.unit2}`;
      },
      error: (error: Error) => {
        console.error(error);
        this.result = `Error: ${error.message}`;
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
        alert('Could not load history. Session may have expired.');
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
}
