import { Injectable } from '@angular/core';
import { AutoCompleteService } from "ionic2-auto-complete/auto-complete.service";
import { CacheProvider } from "../cache/cache";

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

            console.log(JSON.stringify(this.itemList[0]));

        }).catch((err) => {
            console.log(JSON.stringify(err));
        });
    }

    getResults(keyword:string) {
        return this.itemList.filter(
            (item:any) => {
                //noinspection TypeScriptUnresolvedVariable
                if (item.InventoryID.value.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
                    return true;

                for (var i in item.CrossReferences) {
                    if (item.CrossReferences[i].AlternateID.value.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
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
