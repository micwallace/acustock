import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BinTransferPage } from './bin-transfer';

@NgModule({
  declarations: [
    BinTransferPage,
  ],
  imports: [
    IonicPageModule.forChild(BinTransferPage),
  ],
})
export class BinTransferPageModule {}
