import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CountPage } from './count';

@NgModule({
    declarations: [
        CountPage,
    ],
    imports: [
        IonicPageModule.forChild(CountPage),
    ],
})
export class CountPageModule {
}
