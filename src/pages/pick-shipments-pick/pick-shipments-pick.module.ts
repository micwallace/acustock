import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PickShipmentsPickPage } from './pick-shipments-pick';

@NgModule({
  declarations: [
    PickShipmentsPickPage,
  ],
  imports: [
    IonicPageModule.forChild(PickShipmentsPickPage),
  ],
})
export class PickShipmentsPickPageModule {}
