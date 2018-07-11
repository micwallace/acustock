import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransferHistoryTab } from './transfer-history';

@NgModule({
    declarations: [
        TransferHistoryTab,
    ],
    imports: [
        IonicPageModule.forChild(TransferHistoryTab),
    ],
})
export class TransferHistoryTabModule {
}
