import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PickTab } from './pick';

@NgModule({
  declarations: [
    PickTab,
  ],
  imports: [
    IonicPageModule.forChild(PickTab),
  ],
})
export class PickTabModule {}
