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
export class ItemAutocompleteService implements AutoCompleteService {
    labelAttribute = "label";
    formValueAttribute = "";

    itemList = [];

    constructor(public cacheProvider:CacheProvider) {
        this.cacheProvider.getItemList().then((res:any) => {

            this.itemList = res;

            //console.log(JSON.stringify(this.itemList[0]));

        }).catch((err) => {
            //console.log(JSON.stringify(err));
        });
    }

    getResults(keyword:string) {

        keyword = keyword.toLowerCase().trim();

        if (keyword == "" || keyword.length < 3)
            return [];

        return this.itemList.filter(
            (item:any) => {
                //noinspection TypeScriptUnresolvedVariable
                if (item.InventoryID.value.toLowerCase().indexOf(keyword) !== -1)
                    return true;

                if (item.Description.value.toLowerCase().indexOf(keyword) !== -1)
                    return true;

                for (var i in item.CrossReferences) {
                    if (item.CrossReferences[i].AlternateID.value.toLowerCase().indexOf(keyword) !== -1) {
                        item.AlternateID = item.CrossReferences[i].AlternateID.value;
                        return true;
                    }
                }

                return false;
            });
    }

    getItemLabel(item:any) {
        return item.InventoryID.value;
    }
}
