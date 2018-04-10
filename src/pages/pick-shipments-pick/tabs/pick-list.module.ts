import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PickListTab } from './pick-list';

@NgModule({
  declarations: [
    PickListTab,
  ],
  imports: [
    IonicPageModule.forChild(PickListTab),
  ],
})
export class PickListTabModule {}
