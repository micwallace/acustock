import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceiveShipmentListTab } from './list';

@NgModule({
    declarations: [
        ReceiveShipmentListTab,
    ],
    imports: [
        IonicPageModule.forChild(ReceiveShipmentListTab),
    ],
})
export class ReceiveShipmentListTabModule {
}
