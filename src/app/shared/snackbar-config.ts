import { MatSnackBarConfig } from '@angular/material/snack-bar';

export function defaultSnackbarConfig(overrideConfig?: MatSnackBarConfig): MatSnackBarConfig {
  return {
    verticalPosition: overrideConfig ? (overrideConfig.verticalPosition ? overrideConfig.verticalPosition : 'top') : 'top',
    horizontalPosition: overrideConfig ? (overrideConfig.horizontalPosition ? overrideConfig.horizontalPosition : 'right') : 'right',
    duration: overrideConfig ? (overrideConfig.duration ? overrideConfig.duration : 2000) : 2000,
    direction: overrideConfig?.direction,
    data: overrideConfig?.data,
    panelClass: overrideConfig?.panelClass,
    politeness: overrideConfig?.politeness,
    viewContainerRef: overrideConfig?.viewContainerRef,
    announcementMessage: overrideConfig?.announcementMessage,
  };
}
