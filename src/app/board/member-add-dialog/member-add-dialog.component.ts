import { Component, WritableSignal, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-member-add-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './member-add-dialog.component.html',
  styleUrl: './member-add-dialog.component.scss',
})
export class MemberAddDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MemberAddDialogComponent>);
  readonly nameOrEmail = model('');
  readonly nameEmpty: WritableSignal<boolean> = signal(false);

  onSubmit(): void {
    if (this.nameOrEmail().length !== 0) {
      this.dialogRef.close(this.nameOrEmail());
    } else {
      this.nameEmpty.set(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
