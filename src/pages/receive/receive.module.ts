import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceivePage } from './receive';

@NgModule({
    declarations: [
        ReceivePage,
    ],
    imports: [
        IonicPageModule.forChild(ReceivePage),
    ],
})
export class ReceivePageModule {
}
