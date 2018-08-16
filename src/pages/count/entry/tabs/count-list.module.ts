import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CountEntryListTab } from './count-list';

@NgModule({
    declarations: [
        CountEntryListTab,
    ],
    imports: [
        IonicPageModule.forChild(CountEntryListTab),
    ],
})
export class CountEntryListTabModule {
}
