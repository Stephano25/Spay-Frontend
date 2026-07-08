// frontend/src/app/components/admin/qr-scanner/qr-scanner.component.ts
import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css'],
})
export class QRScannerComponent implements OnDestroy {
  @Output() scanResult = new EventEmitter<string>();
  @Output() closeScanner = new EventEmitter<void>();

  qrInput: string = '';
  isScanning: boolean = false;
  isDragging: boolean = false;

  ngOnDestroy(): void {
    // Nettoyer
  }

  scan(): void {
    if (!this.qrInput || this.isScanning) return;

    this.isScanning = true;
    
    // ✅ Vérifier si c'est du JSON
    try {
      const parsed = JSON.parse(this.qrInput);
      this.scanResult.emit(JSON.stringify(parsed));
    } catch {
      // ✅ Sinon, envoyer comme un QR simple
      this.scanResult.emit(this.qrInput);
    }
    this.isScanning = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (result) {
          // ✅ Simulation de lecture QR Code depuis une image
          const simulatedData = {
            type: 'admin_transaction',
            action: 'deposit',
            adminId: 'admin-' + Date.now().toString(36),
            adminName: 'Administrateur SPaye',
            amount: 1000,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            signature: 'simulated-' + Date.now()
          };
          this.qrInput = JSON.stringify(simulatedData);
          this.scan();
        }
      } catch (error) {
        console.error('Erreur lecture fichier:', error);
        alert('Erreur lors de la lecture de l\'image');
      }
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type.startsWith('image/')) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = files;
      this.onFileSelected({ target: input } as any);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  close(): void {
    this.closeScanner.emit();
  }
}