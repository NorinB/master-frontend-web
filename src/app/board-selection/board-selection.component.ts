import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { AppbarService } from '../shared/title.service';
import { BoardService } from '../shared/board.service';
import { Board } from '../shared/models/board.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UnexpectedApiError } from '../shared/error';
import { defaultSnackbarConfig } from '../shared/snackbar-config';

@Component({
  selector: 'board-selection',
  standalone: true,
  imports: [],
  templateUrl: './board-selection.component.html',
  styleUrl: './board-selection.component.scss',
})
export class BoardSelectionComponent implements OnInit {
  public boards: WritableSignal<Board[]> = signal([]);

  constructor(
    private appbarService: AppbarService,
    private boardService: BoardService,
    private snackBar: MatSnackBar,
  ) {
    this.appbarService.updateTitle('Boardauswahl');
    this.appbarService.setActions([
      {
        icon: 'refresh',
        action: this.updateBoardsWithUser.bind(this),
      },
    ]);
  }

  ngOnInit(): void {
    this.updateBoardsWithUser();
  }

  public async updateBoardsWithUser(): Promise<void> {
    try {
      this.boards.set(await this.boardService.getBoardsWithUser());
    } catch (e) {
      if (e instanceof UnexpectedApiError) {
        this.snackBar.open('Boards konnten nicht aktualisiert werden', 'Ok', defaultSnackbarConfig());
      }
      this.boards.set([]);
    }
  }
}
