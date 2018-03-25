import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ItemLookupDetailsPage } from './item-lookup-details';

@NgModule({
  declarations: [
    ItemLookupDetailsPage,
  ],
  imports: [
    IonicPageModule.forChild(ItemLookupDetailsPage),
  ],
})
export class ItemLookupDetailsPageModule {}
