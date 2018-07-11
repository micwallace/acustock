import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PickShipmentsListPage } from './pick-shipments-list';

@NgModule({
    declarations: [
        PickShipmentsListPage,
    ],
    imports: [
        IonicPageModule.forChild(PickShipmentsListPage),
    ],
})
export class PickShipmentsListPageModule {
}
