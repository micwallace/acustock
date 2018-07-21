import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceiveShipmentPendingTab } from './pending';

@NgModule({
    declarations: [
        ReceiveShipmentPendingTab,
    ],
    imports: [
        IonicPageModule.forChild(ReceiveShipmentPendingTab),
    ],
})
export class ReceiveShipmentPendingTabModule {
}
