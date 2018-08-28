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

            console.log(JSON.stringify(this.binList[0]));

        }).catch((err) => {
            console.log("Error:" + JSON.stringify(err));
        });
    }

    getResults(keyword:string) {
        return this.binList.filter(
            item => {
                //noinspection TypeScriptUnresolvedVariable
                return item.LocationID.value.toLowerCase().startsWith(keyword.toLowerCase());
            });
    }

    getItemLabel(item:any) {
        return item.LocationID.value;
    }
}
