import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CountEntryEnterTab } from './count-enter';

@NgModule({
    declarations: [
        CountEntryEnterTab,
    ],
    imports: [
        IonicPageModule.forChild(CountEntryEnterTab),
    ],
})
export class CountEntryEnterTabModule {
}
