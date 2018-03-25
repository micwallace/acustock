import { Injectable } from '@angular/core';
import { Api } from "../api/api";

/*
 Generated class for the CacheProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class CacheProvider {

    itemList = null;
    binList = null;

    constructor(public api:Api) {
        console.log('Hello CacheProvider Provider');
    }

    public getItemList() {
        return new Promise((resolve, reject) => {

            if (this.itemList == null) {
                this.initialLoad().then((res) => {
                    resolve(this.itemList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.itemList);
        });
    }

    public getBinList() {

        return new Promise((resolve, reject) => {

            if (this.binList == null) {
                this.initialLoad().then(() => {
                    resolve(this.binList);
                }).catch((err) => {
                    reject(err);
                });
                return;
            }

            resolve(this.binList);
        });

    }

    public initialLoad() {
        return new Promise((resolve, reject) => {
            this.api.getWarehouseList().then((warehouseList : any) => {

                var binList = [];
                for (var i = 0; i < warehouseList.length; i++) {
                    binList = binList.concat(warehouseList[i].Locations);
                }

                this.binList = binList;

                this.api.getItemList().then((itemList) => {

                    this.itemList = itemList;

                    resolve();

                }).catch((err) => {
                    reject(err);
                });

            }).catch((err) => {
                reject(err);
            });
        });
    }

}
