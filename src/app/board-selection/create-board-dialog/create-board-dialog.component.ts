import { Component, WritableSignal, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'create-board-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './create-board-dialog.component.html',
  styleUrl: './create-board-dialog.component.scss',
})
export class CreateBoardDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateBoardDialogComponent>);
  readonly boardName = model('');
  readonly nameEmpty: WritableSignal<boolean> = signal(false);

  onSubmit(): void {
    if (this.boardName().length !== 0) {
      this.dialogRef.close(this.boardName());
    } else {
      this.nameEmpty.set(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
