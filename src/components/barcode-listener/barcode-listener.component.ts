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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Events } from 'ionic-angular'
import { PreferencesProvider } from "../../providers/core/preferences";

@Component({
    selector: 'barcode-listener',
    templateUrl: 'barcode-listener.component.html'
})

export class BarcodeListenerComponent implements OnInit, OnDestroy {

    currentTime = 0;
    currentTimeDiff = 0;
    previousTimeDiff = 0;
    currentKey:string;
    previousKey:string;
    outputString:string = '';

    threshold = 30;

    constructor(public events: Events, public prefs:PreferencesProvider) {
        let threshold = parseInt(this.prefs.getPreference("scan_threshold"));
        if (threshold)
            this.threshold = threshold;
    }

    keypressListener = (e)=>{
        this.keypressHandler(e);
    };

    keydownListener = (e)=>{
        if (this.outputString != "" && (e.key == "Enter" || e.key == "Tab"))
            this.keypressHandler(e);
    };

    ngOnInit() {
        document.addEventListener('keypress', this.keypressListener);
        document.addEventListener('keydown', this.keydownListener);
    }

    ngOnDestroy() {
        document.removeEventListener('keypress', this.keypressListener);
        document.removeEventListener('keydown', this.keydownListener);
    }

    keypressHandler(e:any) {
        let timestamp = new Date().getTime();
        this.previousKey = this.currentKey;
        this.currentKey = e.key;

        //console.log(e.key);

        if (this.currentTime) {
            this.previousTimeDiff = this.currentTimeDiff;
            this.currentTimeDiff = timestamp - this.currentTime;
        }

        this.currentTime = timestamp;

        //console.log(this.currentTimeDiff)
        //console.log("Key press: "+ e.key);

        //if either the current time diff is less than 15, or the current time diff is less than 15
        //and the previous time diff was greater than 15. This is in the case where there is certainly a longer
        //period between scans
        if ((this.currentTimeDiff <= this.threshold) || (this.currentTimeDiff <= this.threshold && this.previousTimeDiff > this.threshold)) {
            //We must initially evaluate the previous and current time diffs. This is how we know a scan has started,
            //because the second time diff will be very low, while the first will be very high, because a human cannot scan
            //something is less than 15 milliseconds
            if (this.currentTimeDiff <= this.threshold && this.previousTimeDiff > (this.threshold + 4)) {
                this.outputString = '';
                this.outputString += this.previousKey;
                this.outputString += this.currentKey;
            }

            //If they are both less than 15, we know we are beyond the first characters,
            //and we may start only adding the current character. Also, the current code cannot
            //be Enter/Tab, because that is when we need to emit the outputString
            if (this.currentTimeDiff <= this.threshold && this.previousTimeDiff <= this.threshold && !BarcodeListenerComponent.isDelimiterKey(e)) {
                this.outputString += this.currentKey;
                // This prevents active element such as buttons from triggering their click event when the enter key is pressed.
                (document.activeElement as HTMLElement).blur();
            }

            //If we are in the middle of the scan and the code is 13, we can stop adding to the
            //outputString and emit it instead. We must then set is back to empty for the next scan.
            if (this.currentTimeDiff <= this.threshold && this.previousTimeDiff <= this.threshold && BarcodeListenerComponent.isDelimiterKey(e) && this.outputString !== '') {
                this.events.publish('barcode:scan', this.outputString);
                this.outputString = '';
            }

        }

    }

    static isDelimiterKey(keyevent){

        if (keyevent.key == 'Enter' || keyevent.which == 13)
            return true;

        return keyevent.key == 'Tab' || keyevent.which == 9;
    }

}
