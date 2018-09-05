import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AdjustmentPage } from './adjustment';

@NgModule({
    declarations: [
        AdjustmentPage,
    ],
    imports: [
        IonicPageModule.forChild(AdjustmentPage),
    ],
})
export class AdjustmentPageModule {
}
