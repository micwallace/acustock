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
import { Api } from "../core/api";
import { PreferencesProvider } from "../core/preferences";

/*
 Generated class for the ReceiveProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class CountProvider {

    public physicalCount = null;

    public countIndex = {};

    //public countHistory = [];

    public pendingCounts = {};

    public totalBookQty = 0;

    public totalCountedQty = 0;

    public totalPendingQty = 0;

    public countPercent = "0";

    private savedCounts = null;

    private lastRequest:any = "";

    constructor(public api:Api, public prefs:PreferencesProvider) {
    }

    public getCountList(){
        return new Promise((resolve, reject)=> {
            this.api.getCountList(this.prefs.getPreference('warehouse')).then((res:any)=>{
                resolve(res);
            }).catch((err)=>{
                reject(err);
            });
        });
    }

    public loadCount(referenceNbr) {

        return new Promise((resolve, reject)=> {

            this.api.getCount(referenceNbr).then((res:any)=>{

                console.log(JSON.stringify(res));

                let curWarehouse = this.prefs.getPreference('warehouse');
                let warehouse = res.WarehouseID.value;

                if (warehouse !== curWarehouse) {
                    reject({message:"Physical Count #" + referenceNbr + " was found but belongs to warehouse " + warehouse + ", not the currently selected warehouse which is " + curWarehouse});
                    return;
                }

                this.physicalCount = res;
                this.generateIndex();
                this.calculateTotals();

                let counts = JSON.parse(localStorage.getItem("unconfirmed_counts"));

                let id = this.physicalCount.ReferenceNbr.value;

                if (counts && counts.hasOwnProperty(id)) {
                    this.savedCounts = counts[id];
                } else {
                    this.savedCounts = null;
                }

                resolve(true);

            }).catch((err)=>{

                if (err.status == 404)
                    err.message = "Physical Count with ID " + referenceNbr + " was not found in the system.";

                reject(err);
            });
        });
    }

    public generateIndex(){

        this.countIndex = {};

        for (let i = 0; i < this.physicalCount.Details.length; i++){

            let line = this.physicalCount.Details[i];

            let key = line.InventoryID.value + "-" + line.LocationID.value;

            this.countIndex[key] = line;

        }
    }

    public calculateTotals(){

        this.totalBookQty = 0;
        this.totalCountedQty = 0;
        this.totalPendingQty = 0;

        for (let i in this.countIndex){

            this.totalBookQty += this.countIndex[i].BookQuantity.value;

            if (this.countIndex[i].PhysicalQuantity.hasOwnProperty('value'))
                this.totalCountedQty += this.countIndex[i].PhysicalQuantity.value;
        }

        for (let i in this.pendingCounts){
            this.totalCountedQty += this.pendingCounts[i].PendingQty;
            this.totalPendingQty += this.pendingCounts[i].PendingQty
        }

        this.countPercent = ((this.totalCountedQty / this.totalBookQty) * 100).toFixed(2);
    }

    public getCountLine(data){

        let key = data.item + "-" + data.location;

        if (!this.countIndex.hasOwnProperty(key))
            return null;

        return this.countIndex[key];
    }

    public addNewCountLine(data){

        return new Promise((resolve, reject)=> {

            let countData = {
                ReferenceNbr: this.physicalCount.ReferenceNbr,
                Details: [{
                    InventoryID: {value: data.item},
                    LocationID: {value: data.location}
                }]
            };

            this.lastRequest = countData;

            this.api.putCount(countData).then((res)=>{

                this.physicalCount = res;
                this.generateIndex();
                this.calculateTotals();

                let key = data.item + "-" + data.location;

                if (!this.countIndex.hasOwnProperty(key))
                    reject({message: "Could not locate count object in index."});

                return resolve(this.countIndex[key]);

            }).catch((err)=>{
                reject(err);
            });
        });
    }

    public getCountedQty(key){

        if (!this.countIndex.hasOwnProperty(key))
            return 0;

        let counted = 0;

        if (this.countIndex[key].PhysicalQuantity.hasOwnProperty('value'))
            counted = this.countIndex[key].PhysicalQuantity.value;

        return (counted + this.getPendingQty(key));
    }

    public getBookQty(key){

        if (!this.countIndex.hasOwnProperty(key))
            return 0;

        return this.countIndex[key].BookQuantity.value;
    }

    public getPendingQty(key){

        if (!this.pendingCounts.hasOwnProperty(key))
            return 0;

        return this.pendingCounts[key].PendingQty;
    }

    public setCount(countLine, qty, add=true){

        qty = parseFloat(qty);

        let key = countLine.InventoryID.value + "-" + countLine.LocationID.value;

        if (!this.pendingCounts.hasOwnProperty(key)) {
            this.pendingCounts[key] = countLine;
            this.pendingCounts[key].PendingQty = 0;
        }

        if (add) {
            this.pendingCounts[key].PendingQty += qty;
        } else {
            this.pendingCounts[key].PendingQty = qty;
        }

        this.savePendingCounts();
    }

    public removeCount(countLine){

        let key = countLine.InventoryID.value + "-" + countLine.LocationID.value;

        if (this.pendingCounts.hasOwnProperty(key)) {
            delete this.pendingCounts[key];

            this.savePendingCounts();
        }
    }

    public savePendingCounts() {

        let receipts = JSON.parse(localStorage.getItem("unconfirmed_counts"));

        if (!receipts)
            receipts = {};

        if (Object.keys(this.pendingCounts).length > 0) {
            receipts[this.physicalCount.ReferenceNbr.value] = this.pendingCounts;
        } else {
            delete receipts[this.physicalCount.ReferenceNbr.value];
        }

        localStorage.setItem("unconfirmed_counts", JSON.stringify(receipts));

        console.log("Counts saved");
        this.calculateTotals();
    }

    public hasSavedCounts() {
        return this.savedCounts != null;
    }

    public loadSavedCounts() {
        if (this.savedCounts != null)
            this.pendingCounts = this.savedCounts;
        this.calculateTotals();
    }

    public clearSavedCounts() {

        let receipts = JSON.parse(localStorage.getItem("unconfirmed_counts"));

        if (!receipts)
            return;

        delete receipts[this.physicalCount.ReferenceNbr.value];

        localStorage.setItem("unconfirmed_counts", JSON.stringify(receipts));

        this.savedCounts = null;
        this.pendingCounts = {};
        this.calculateTotals();
    }

    public commitPendingCounts(){

        return new Promise((resolve, reject)=> {

            this.api.getCount(this.physicalCount.ReferenceNbr.value).then((res:any)=>{

                this.physicalCount = res;
                this.generateIndex();
                this.calculateTotals();

                let data = {
                    ReferenceNbr: this.physicalCount.ReferenceNbr,
                    Details: []
                };

                for (let i in this.pendingCounts){

                    let line = this.pendingCounts[i];

                    // Get physical count line from count index.
                    let key = line.InventoryID.value + "-" + line.LocationID.value;

                    line.PhysicalQuantity = this.countIndex[key].PhysicalQuantity;

                    if (!line.PhysicalQuantity.hasOwnProperty('value'))
                        line.PhysicalQuantity.value = 0;

                    line.PhysicalQuantity.value += line.PendingQty;
                    delete line.PendingQty;

                    data.Details.push(line);
                }

                this.lastRequest = data;

                this.api.putCount(data).then((res)=>{

                    this.physicalCount = res;
                    this.generateIndex();

                    this.pendingCounts = {};
                    this.clearSavedCounts();

                    this.calculateTotals();

                    resolve(true);
                }).catch((err)=>{
                    reject(err);
                });

            }).catch((err)=>{
                err.message = "Physical Count count not be reloaded: " + err.message;
                reject(err);
            });

        });
    }

    public getErrorReportingData(){
        return {provider: "count", pendingItems: this.pendingCounts, lastRequest: this.lastRequest};
    }
}