import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CountEntryPendingTab } from './pending-list';

@NgModule({
    declarations: [
        CountEntryPendingTab,
    ],
    imports: [
        IonicPageModule.forChild(CountEntryPendingTab),
    ],
})
export class CountEntryPendingTabModule {
}
