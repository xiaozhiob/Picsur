import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarType } from 'src/app/models/snack-bar-type';
import { UtilService } from 'src/app/util/util.service';

@Component({
  selector: 'copy-field',
  templateUrl: './copy-field.component.html',
  styleUrls: ['./copy-field.component.scss'],
})
export class CopyFieldComponent {
  // Two paramets: name, value
  @Input() label: string = 'Loading...';
  @Input() value: string = 'Loading...';

  constructor(private utilService: UtilService) {}

  public copy() {
    try {
      navigator.clipboard.writeText(this.value);
    } catch (e) {
      return this.utilService.showSnackBar(
        'Copying to clipboard failed',
        SnackBarType.Error
      );
    }

    this.utilService.showSnackBar(`Copied ${this.label}!`, SnackBarType.Info);
  }
}