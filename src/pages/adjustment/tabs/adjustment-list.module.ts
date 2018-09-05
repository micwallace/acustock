import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AdjustmentListTab } from './adjustment-list';

@NgModule({
    declarations: [
        AdjustmentListTab,
    ],
    imports: [
        IonicPageModule.forChild(AdjustmentListTab),
    ],
})
export class AdjustmentListTabModule {
}
