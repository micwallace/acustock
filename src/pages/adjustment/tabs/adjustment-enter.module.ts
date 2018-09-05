import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AdjustmentEnterTab } from './adjustment-enter';

@NgModule({
    declarations: [
        AdjustmentEnterTab,
    ],
    imports: [
        IonicPageModule.forChild(AdjustmentEnterTab),
    ],
})
export class AdjustmentEnterTabModule {
}
