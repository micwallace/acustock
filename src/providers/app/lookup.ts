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

import { Injectable } from '@angular/core';
import { Api } from '../core/api'
import { CacheProvider } from '../core/cache'
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the PickProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class LookupProvider {

    item = null;

    itemLocations = [];

    location = null;

    locationItems = [];

    constructor(public api:Api, public prefs:PreferencesProvider, public cache:CacheProvider) {

    }

    loadItemLocations(item) {

        return new Promise((resolve, reject)=> {

            this.api.getItemWarehouseLocations(item.InventoryID.value, this.prefs.getPreference('warehouse')).then((res:any) => {

                this.cache.getBinList().then((bins:any)=> {

                    for (let location of res) {
                        for (let bin of bins) {
                            if (location.Location.value == bin.LocationID.value) {
                                location.LocDescription = bin.Description.value;
                                break;
                            }
                        }
                    }

                    this.item = item.InventoryID.value;
                    this.itemLocations = res;

                    resolve();

                }).catch((err)=> {
                    this.item = null;
                    reject(err);
                });

            }).catch((err) => {
                this.item = null;
                reject(err);
            });
        });
    }

    loadLocationItems(item) {

        return new Promise((resolve, reject)=> {

            this.api.getLocationContents(item.LocationID.value, this.prefs.getPreference('warehouse')).then((res:any) => {

                this.location = item.LocationID.value;
                this.locationItems = res;

                resolve();

            }).catch((err) => {
                this.location = null;
                reject(err);
            });

        });
    }
}
