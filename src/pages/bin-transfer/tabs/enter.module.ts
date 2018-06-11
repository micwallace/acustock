import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EnterTab } from './enter';

@NgModule({
  declarations: [
    EnterTab,
  ],
  imports: [
    IonicPageModule.forChild(EnterTab),
  ],
})
export class EnterTabModule {}
