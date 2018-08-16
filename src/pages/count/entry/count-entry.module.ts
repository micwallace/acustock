import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CountEntryPage } from './count-entry';

@NgModule({
    declarations: [
        CountEntryPage,
    ],
    imports: [
        IonicPageModule.forChild(CountEntryPage),
    ],
})
export class CountEntryPageModule {
}
