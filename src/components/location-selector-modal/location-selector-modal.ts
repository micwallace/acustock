/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
    selector: 'location-selector',
    templateUrl: 'location-selector-modal.html'
})
export class LocationSelectorModal {

    public locations:any = [];

    constructor(params:NavParams, public viewCtrl:ViewController) {
        this.locations = params.get('locations');
    }

    // TODO: Maybe put this in utils class once it's used in multiple places?
    /*public static createModal(locations:Array<any>){

        var modal = modalController.create({
            component: this,
            componentProps: {
                locations: locations
            }
        });

        modal.present();

        return modal;
    }*/

    public selectLocation(location){
        this.viewCtrl.dismiss({
           location: location.Location.value
        });
    }

}