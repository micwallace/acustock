import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BinLookupPage } from './bin-lookup';

@NgModule({
    declarations: [
        BinLookupPage,
    ],
    imports: [
        IonicPageModule.forChild(BinLookupPage),
    ],
})
export class BinLookupPageModule {
}
