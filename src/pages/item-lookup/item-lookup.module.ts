import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ItemLookupPage } from './item-lookup';

@NgModule({
    declarations: [
        ItemLookupPage,
    ],
    imports: [
        IonicPageModule.forChild(ItemLookupPage),
    ],
})
export class ItemLookupPageModule {
}
