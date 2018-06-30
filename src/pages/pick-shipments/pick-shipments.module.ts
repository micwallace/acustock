import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular/index';
import { PickShipmentsPage } from './pick-shipments';

@NgModule({
  declarations: [
    PickShipmentsPage,
  ],
  imports: [
    IonicPageModule.forChild(PickShipmentsPage),
  ],
})
export class PickShipmentsPageModule {}
