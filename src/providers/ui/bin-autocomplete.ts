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
import { AutoCompleteService } from "ionic2-auto-complete/auto-complete.service";
import { CacheProvider } from "../core/cache";

/*
 Generated class for the ItemAutocompleteProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class LocationAutocompleteService implements AutoCompleteService {
    labelAttribute = "label";
    formValueAttribute = "";

    binList = [];

    constructor(public cacheProvider:CacheProvider) {
        this.cacheProvider.getBinList().then((res:any) => {

            this.binList = res;

            //console.log(JSON.stringify(this.binList[0]));

        }).catch((err) => {
            //console.log("Error:" + JSON.stringify(err));
        });
    }

    getResults(keyword:string) {

        keyword = keyword.toLowerCase().trim();

        return this.binList.filter(
            item => {
                if (item.Description.value.toLowerCase().indexOf(keyword) !== -1)
                    return true;
                //noinspection TypeScriptUnresolvedVariable
                return item.LocationID.value.toLowerCase().startsWith(keyword);
            });
    }

    getItemLabel(item:any) {
        return item.LocationID.value;
    }
}
