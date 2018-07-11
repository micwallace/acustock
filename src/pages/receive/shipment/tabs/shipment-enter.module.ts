import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceiveShipmentEnterTab } from './shipment-enter';

@NgModule({
    declarations: [
        ReceiveShipmentEnterTab,
    ],
    imports: [
        IonicPageModule.forChild(ReceiveShipmentEnterTab),
    ],
})
export class ReceiveShipmentEnterTabModule {
}
