import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransferListTab } from './transfer-list';

@NgModule({
  declarations: [
    TransferListTab,
  ],
  imports: [
    IonicPageModule.forChild(TransferListTab),
  ],
})
export class TransferListTabModule {}
