import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UnpickedListTab } from './unpicked-list';

@NgModule({
  declarations: [
    UnpickedListTab,
  ],
  imports: [
    IonicPageModule.forChild(UnpickedListTab),
  ],
})
export class UnpickedListTabModule {}
